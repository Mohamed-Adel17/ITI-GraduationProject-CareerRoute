using CareerRoute.API.Models;
using CareerRoute.Core.DTOs.Zoom;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Settings;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using System.Security.Cryptography;
using System.Text;

namespace CareerRoute.API.Controllers.Webhooks
{
    /// <summary>
    /// Controller for handling Zoom webhook events
    /// </summary>
    [ApiController]
    [Route("api/webhooks/zoom")]
    [Produces("application/json")]
    [DisableRateLimiting]
    public class ZoomWebhookController : ControllerBase
    {
        private readonly ISessionService _sessionService;
        private readonly ILogger<ZoomWebhookController> _logger;
        private readonly ZoomSettings _zoomSettings;

        public ZoomWebhookController(
            ISessionService sessionService,
            ILogger<ZoomWebhookController> logger,
            IOptions<ZoomSettings> zoomSettings)
        {
            _sessionService = sessionService;
            _logger = logger;
            _zoomSettings = zoomSettings.Value;
        }

        /// <summary>
        /// Receives Zoom webhook events for recording completion and meeting events
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> HandleWebhook()
        {
            string requestBody = "";
            
            // Read request body manually to support signature verification
            Request.EnableBuffering();
            using (var reader = new StreamReader(Request.Body, Encoding.UTF8, leaveOpen: true))
            {
                requestBody = await reader.ReadToEndAsync();
                Request.Body.Position = 0;
            }

            if (!VerifyWebhookSignature(requestBody))
            {
                _logger.LogWarning("[ZoomWebhook] Webhook signature verification failed");
                return BadRequest(new ApiResponse
                {
                    Success = false,
                    Message = "Invalid webhook signature",
                    StatusCode = StatusCodes.Status400BadRequest
                });
            }

            var payload = JsonConvert.DeserializeObject<ZoomWebhookPayload>(requestBody);
            if (payload == null)
            {
                _logger.LogWarning("[ZoomWebhook] Received invalid payload format");
                return BadRequest(new ApiResponse { Success = false, Message = "Invalid payload format" });
            }

            _logger.LogInformation("[ZoomWebhook] Received event: {EventType}", payload.Event);

            switch (payload.Event)
            {
                case "endpoint.url_validation":
                    return HandleUrlValidation(payload);

                case "meeting.started":
                    await HandleMeetingStartedEvent(payload);
                    break;

                case "recording.completed":
                    await HandleRecordingCompletedEvent(payload);
                    break;

                case "recording.transcript_completed":
                    _logger.LogInformation("[ZoomWebhook] Processing recording.transcript_completed as recording.completed");
                    await HandleRecordingCompletedEvent(payload);
                    break;

                case "meeting.ended":
                    await HandleMeetingEndedEvent(payload);
                    break;

                default:
                    _logger.LogInformation("[ZoomWebhook] Unhandled event type: {EventType}", payload.Event);
                    break;
            }

            return Ok(new ApiResponse { Success = true, Message = "Webhook event processed successfully" });
        }

        private IActionResult HandleUrlValidation(ZoomWebhookPayload payload)
        {
            var plainToken = payload.Payload.PlainToken;
            if (string.IsNullOrEmpty(plainToken))
            {
                return BadRequest(new ApiResponse { Success = false, Message = "plainToken is missing" });
            }

            if (string.IsNullOrEmpty(_zoomSettings.WebhookSecretToken))
            {
                _logger.LogError("[ZoomWebhook] WebhookSecretToken is not configured");
                return StatusCode(500, new ApiResponse { Success = false, Message = "Server configuration error" });
            }

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_zoomSettings.WebhookSecretToken));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(plainToken));
            var encryptedToken = BitConverter.ToString(hash).Replace("-", "").ToLower();

            _logger.LogInformation("[ZoomWebhook] Validated URL challenge successfully");

            return Ok(new
            {
                plainToken = plainToken,
                encryptedToken = encryptedToken
            });
        }

        private async Task HandleMeetingStartedEvent(ZoomWebhookPayload payload)
        {
            var meetingId = payload.Payload.Object.Id;
            var topic = payload.Payload.Object.Topic;

            _logger.LogInformation(
                "[ZoomWebhook] [AUDIT] Meeting started. MeetingId: {MeetingId}, Topic: {Topic}",
                meetingId, topic);

            await _sessionService.MarkSessionAsInProgressAsync(meetingId);
        }

        private async Task HandleRecordingCompletedEvent(ZoomWebhookPayload payload)
        {
            var meetingId = payload.Payload.Object.Id;
            var recordingFiles = payload.Payload.Object.RecordingFiles ?? new List<ZoomRecordingFileDto>();

            var mp4Count = recordingFiles.Count(f => string.Equals(f.FileType, "MP4", StringComparison.OrdinalIgnoreCase));
            var totalSize = recordingFiles.Sum(f => f.FileSize);

            _logger.LogInformation(
                "[ZoomWebhook] [AUDIT] Processing recording.completed. MeetingId: {MeetingId}, Files: {Count}, MP4: {Mp4Count}, TotalSize: {Size}",
                meetingId, recordingFiles.Count, mp4Count, totalSize);

            var downloadToken = payload.Payload.Object.DownloadAccessToken;
            
            await _sessionService.ProcessRecordingCompletedAsync(meetingId, recordingFiles, downloadToken);

            _logger.LogInformation("[ZoomWebhook] [AUDIT] Completed processing recording.completed for MeetingId: {MeetingId}", meetingId);
        }

        private Task HandleMeetingEndedEvent(ZoomWebhookPayload payload)
        {
            var meetingId = payload.Payload.Object.Id;
            var topic = payload.Payload.Object.Topic;
            var duration = payload.Payload.Object.Duration;

            _logger.LogInformation(
                "[ZoomWebhook] [AUDIT] Meeting ended. MeetingId: {MeetingId}, Topic: {Topic}, Duration: {Duration}min",
                meetingId, topic, duration);

            return Task.CompletedTask;
        }

        private bool VerifyWebhookSignature(string body)
        {
            if (!Request.Headers.TryGetValue("x-zm-signature", out var signatureHeader))
            {
                _logger.LogWarning("[ZoomWebhook] Signature header missing");
                return false;
            }

            if (!Request.Headers.TryGetValue("x-zm-request-timestamp", out var timestampHeader))
            {
                _logger.LogWarning("[ZoomWebhook] Timestamp header missing");
                return false;
            }

            if (string.IsNullOrEmpty(_zoomSettings.WebhookSecretToken))
            {
                _logger.LogWarning("[ZoomWebhook] Secret token not configured, skipping verification");
                return true;
            }

            try
            {
                var message = $"v0:{timestampHeader}:{body}";

                using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_zoomSettings.WebhookSecretToken));
                var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(message));
                var computedSignature = $"v0={BitConverter.ToString(hash).Replace("-", "").ToLower()}";

                var isValid = computedSignature.Equals(signatureHeader.ToString(), StringComparison.OrdinalIgnoreCase);

                if (!isValid)
                {
                    _logger.LogWarning("[ZoomWebhook] Signature mismatch. Expected: {Expected}, Received: {Received}", computedSignature, signatureHeader);
                }

                return isValid;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[ZoomWebhook] Error verifying signature");
                return false;
            }
        }
    }
}
