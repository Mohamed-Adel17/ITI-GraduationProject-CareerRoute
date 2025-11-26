using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.Zoom;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;

namespace CareerRoute.API.Controllers
{
    /// <summary>
    /// Temporary controller for testing Zoom Integration without frontend/booking flow.
    /// REMOVE IN PRODUCTION.
    /// </summary>
    [Route("api/test/zoom")]
    [ApiController]
    //[Authorize(Roles = "Admin")] // Uncomment if you want security during testing
    public class ZoomTestController : ControllerBase
    {
        private readonly IBaseRepository<Session> _sessionRepository;
        private readonly IBaseRepository<ApplicationUser> _userRepository;
        private readonly IBaseRepository<Mentor> _mentorRepository;
        private readonly IBaseRepository<TimeSlot> _timeSlotRepository;
        private readonly IZoomService _zoomService;
        private readonly ZoomSettings _zoomSettings;
        private readonly ISessionService _sessionService;
        private readonly IBlobStorageService _blobStorageService;
        private readonly IDeepgramService _deepgramService;

        public ZoomTestController(
            IBaseRepository<Session> sessionRepository,
            IBaseRepository<ApplicationUser> userRepository,
            IBaseRepository<Mentor> mentorRepository,
            IBaseRepository<TimeSlot> timeSlotRepository,
            IZoomService zoomService,
            ISessionService sessionService,
            IOptions<ZoomSettings> zoomSettings,
            IBlobStorageService blobStorageService,
            IDeepgramService deepgramService)
        {
            _sessionRepository = sessionRepository;
            _userRepository = userRepository;
            _mentorRepository = mentorRepository;
            _timeSlotRepository = timeSlotRepository;
            _zoomService = zoomService;
            _zoomSettings = zoomSettings.Value;
            _sessionService = sessionService;
            _blobStorageService = blobStorageService;
            _deepgramService = deepgramService;
        }

        /// <summary>
        /// Seeds a dummy session for testing. Finds the first available Mentor and Mentee.
        /// </summary>
        /// <summary>
        /// Seeds a dummy session for testing. Finds the first available Mentor and Mentee if not provided.
        /// Bypasses the 24-hour booking rule.
        /// </summary>
        [HttpPost("seed-session")]
        public async Task<IActionResult> SeedSession(
            [FromQuery] int offsetMinutes = 10, 
            [FromQuery] int durationMinutes = 60,
            [FromQuery] string? mentorId = null,
            [FromQuery] string? menteeId = null)
        {
            // Get mentor - use provided ID or fall back to first in DB
            Mentor? mentor = null;
            if (!string.IsNullOrEmpty(mentorId))
                mentor = await _mentorRepository.GetByIdAsync(mentorId);
            
            if (mentor == null)
            {
                var mentors = await _mentorRepository.GetAllAsync();
                mentor = mentors.FirstOrDefault();
            }

            if (mentor == null) return NotFound("No mentors found in DB. Create a mentor first.");

            // Get mentee - use provided ID or fall back to first user who is not the mentor
            ApplicationUser? mentee = null;
            if (!string.IsNullOrEmpty(menteeId))
                mentee = await _userRepository.GetByIdAsync(menteeId);
            
            if (mentee == null)
            {
                var users = await _userRepository.GetAllAsync();
                mentee = users.FirstOrDefault(u => u.Id != mentor.Id);
            }
            
            if (mentee == null) return NotFound("No suitable mentee user found in DB.");

            // Validate duration
            if (durationMinutes != 30 && durationMinutes != 60)
            {
                return BadRequest("Duration must be 30 or 60 minutes");
            }
            var durationOption = (DurationOptions)durationMinutes;

            var session = new Session
            {
                Id = Guid.NewGuid().ToString(),
                MentorId = mentor.Id,
                MenteeId = mentee.Id,
                SessionType = SessionTypeOptions.OneOnOne,
                Duration = durationOption,
                Price = durationOption == DurationOptions.SixtyMinutes ? 100 : 50,
                Status = SessionStatusOptions.Confirmed, // Ready for meeting
                ScheduledStartTime = DateTime.UtcNow.AddMinutes(offsetMinutes),
                ScheduledEndTime = DateTime.UtcNow.AddMinutes(offsetMinutes + durationMinutes),
                Topic = "Zoom Integration Test Session",
                Notes = "Auto-generated by ZoomTestController",
                CreatedAt = DateTime.UtcNow
            };

            // Bypass service logic (including 24-hour rule) and save directly
            await _sessionRepository.AddAsync(session);
            await _sessionRepository.SaveChangesAsync();
            
            return Ok(new 
            { 
                Message = "Session Seeded", 
                SessionId = session.Id, 
                Mentee = mentee.Email, 
                Mentor = mentor.Id,
                Duration = durationMinutes
            });
        }

        /// <summary>
        /// Seeds a session AND creates Zoom meeting in one call (skips payment flow entirely).
        /// </summary>
        /// <summary>
        /// Seeds a session AND creates Zoom meeting in one call (skips payment flow entirely).
        /// Bypasses the 24-hour booking rule.
        /// </summary>
        [HttpPost("seed-and-create-meeting")]
        public async Task<IActionResult> SeedAndCreateMeeting(
            [FromQuery] int offsetMinutes = 10, 
            [FromQuery] int durationMinutes = 60,
            [FromQuery] string? mentorId = null,
            [FromQuery] string? menteeId = null)
        {
            // Get mentor - use provided ID or fall back to first in DB
            Mentor? mentor = null;
            if (!string.IsNullOrEmpty(mentorId))
                mentor = await _mentorRepository.GetByIdAsync(mentorId);
            
            if (mentor == null)
            {
                var mentors = await _mentorRepository.GetAllAsync();
                mentor = mentors.FirstOrDefault();
            }

            if (mentor == null) return NotFound("No mentors found in DB. Create a mentor first.");

            // Get mentee - use provided ID or fall back to first user who is not the mentor
            ApplicationUser? mentee = null;
            if (!string.IsNullOrEmpty(menteeId))
                mentee = await _userRepository.GetByIdAsync(menteeId);
            
            if (mentee == null)
            {
                var users = await _userRepository.GetAllAsync();
                mentee = users.FirstOrDefault(u => u.Id != mentor.Id);
            }

            if (mentee == null) return NotFound("No suitable mentee user found in DB.");

            if (durationMinutes != 30 && durationMinutes != 60)
                return BadRequest("Duration must be 30 or 60 minutes");

            var durationOption = (DurationOptions)durationMinutes;

            var session = new Session
            {
                Id = Guid.NewGuid().ToString(),
                MentorId = mentor.Id,
                MenteeId = mentee.Id,
                SessionType = SessionTypeOptions.OneOnOne,
                Duration = durationOption,
                Price = durationOption == DurationOptions.SixtyMinutes ? 100 : 50,
                Status = SessionStatusOptions.Confirmed,
                ScheduledStartTime = DateTime.UtcNow.AddMinutes(offsetMinutes),
                ScheduledEndTime = DateTime.UtcNow.AddMinutes(offsetMinutes + durationMinutes),
                Topic = "Zoom Integration Test Session",
                Notes = "Auto-generated by ZoomTestController (with meeting)",
                CreatedAt = DateTime.UtcNow
            };

            // Bypass service logic (including 24-hour rule) and save directly
            await _sessionRepository.AddAsync(session);
            await _sessionRepository.SaveChangesAsync();

            try
            {
                // Create Zoom meeting immediately
                await _sessionService.CreateZoomMeetingForSessionAsync(session.Id);
                
                // Reload to get updated Zoom details
                session = await _sessionRepository.GetByIdAsync(session.Id);

                return Ok(new
                {
                    Message = "Session seeded and Zoom meeting created successfully",
                    SessionId = session.Id,
                    Mentee = mentee.Email,
                    Mentor = mentor.Id,
                    Duration = durationMinutes,
                    ZoomMeetingId = session.ZoomMeetingId,
                    JoinUrl = session.VideoConferenceLink,
                    Password = session.ZoomMeetingPassword
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Message = "Session seeded but Zoom meeting creation failed",
                    SessionId = session.Id,
                    Error = ex.Message
                });
            }
        }

        /// <summary>
        /// Seeds a session requiring payment (Pending status). Creates a TimeSlot and Session.
        /// Bypasses the 24-hour booking rule for testing. Use normal payment flow after this.
        /// </summary>
        [HttpPost("seed-session-pending-payment")]
        public async Task<IActionResult> SeedSessionPendingPayment(
            [FromQuery] int offsetMinutes = 10, 
            [FromQuery] int durationMinutes = 60,
            [FromQuery] string? mentorId = null,
            [FromQuery] string? menteeId = null)
        {
            // Get mentor - use provided ID or fall back to first in DB
            Mentor? mentor = null;
            if (!string.IsNullOrEmpty(mentorId))
                mentor = await _mentorRepository.GetByIdAsync(mentorId);
            
            if (mentor == null)
            {
                var mentors = await _mentorRepository.GetAllAsync();
                mentor = mentors.FirstOrDefault();
            }

            if (mentor == null) return NotFound("No mentors found in DB. Create a mentor first.");

            // Get mentee - use provided ID or fall back to first user who is not the mentor
            ApplicationUser? mentee = null;
            if (!string.IsNullOrEmpty(menteeId))
                mentee = await _userRepository.GetByIdAsync(menteeId);
            
            if (mentee == null)
            {
                var users = await _userRepository.GetAllAsync();
                mentee = users.FirstOrDefault(u => u.Id != mentor.Id);
            }

            if (mentee == null) return NotFound("No suitable mentee user found in DB.");

            if (durationMinutes != 30 && durationMinutes != 60)
                return BadRequest("Duration must be 30 or 60 minutes");

            var scheduledStart = DateTime.UtcNow.AddMinutes(offsetMinutes);

            // Create a TimeSlot for the mentor (bypassing normal availability checks)
            var timeSlot = new TimeSlot
            {
                Id = Guid.NewGuid().ToString(),
                MentorId = mentor.Id,
                StartDateTime = scheduledStart,
                DurationMinutes = durationMinutes,
                IsBooked = true,
                CreatedAt = DateTime.UtcNow
            };

            var durationOption = (DurationOptions)durationMinutes;

            // Create session with Pending status (requires payment)
            var session = new Session
            {
                Id = Guid.NewGuid().ToString(),
                MentorId = mentor.Id,
                MenteeId = mentee.Id,
                TimeSlotId = timeSlot.Id,
                SessionType = SessionTypeOptions.OneOnOne,
                Duration = durationOption,
                Price = durationOption == DurationOptions.SixtyMinutes ? mentor.Rate60Min : mentor.Rate30Min,
                Status = SessionStatusOptions.Pending, // Requires payment
                ScheduledStartTime = scheduledStart,
                ScheduledEndTime = scheduledStart.AddMinutes(durationMinutes),
                Topic = "Test Session (Pending Payment)",
                Notes = "Auto-generated by ZoomTestController - requires payment",
                CreatedAt = DateTime.UtcNow
            };

            // Link timeslot to session
            timeSlot.SessionId = session.Id;

            // Save both
            await _timeSlotRepository.AddAsync(timeSlot);
            await _sessionRepository.AddAsync(session);
            await _sessionRepository.SaveChangesAsync();
            
            return Ok(new 
            { 
                Message = "Session created with Pending status. Proceed with payment flow.",
                SessionId = session.Id,
                TimeSlotId = timeSlot.Id,
                MenteeId = mentee.Id,
                MenteeEmail = mentee.Email,
                MentorId = mentor.Id,
                Price = session.Price,
                Duration = durationMinutes,
                ScheduledStartTime = session.ScheduledStartTime,
                NextStep = "Call POST /api/payments/create-intent with { sessionId, paymentProvider } then confirm payment"
            });
        }

        /// <summary>
        /// Manually ends a Zoom meeting for a session (for testing).
        /// </summary>
        [HttpPost("end-meeting/{sessionId}")]
        public async Task<IActionResult> EndMeeting(string sessionId)
        {
            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null) return NotFound($"Session {sessionId} not found");

            if (!session.ZoomMeetingId.HasValue)
                return BadRequest("Session has no Zoom meeting");

            try
            {
                var success = await _zoomService.EndMeetingAsync(session.ZoomMeetingId.Value, sessionId, "Ended via test controller");

                if (success)
                {
                    session.Status = SessionStatusOptions.Completed;
                    session.CompletedAt = DateTime.UtcNow;
                    _sessionRepository.Update(session);
                    await _sessionRepository.SaveChangesAsync();

                    return Ok(new
                    {
                        Message = "Zoom meeting ended and session marked as completed",
                        SessionId = sessionId,
                        MeetingId = session.ZoomMeetingId,
                        Status = session.Status.ToString()
                    });
                }

                return BadRequest(new { Message = "Failed to end Zoom meeting - it may have already ended" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        /// <summary>
        /// Manually triggers the Zoom Meeting Creation for a specific session.
        /// </summary>
        [HttpPost("create-meeting/{sessionId}")]
        public async Task<IActionResult> CreateMeeting(string sessionId)
        {
            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null) return NotFound($"Session {sessionId} not found");

            if (session.ZoomMeetingId != null)
            {
                return BadRequest($"Session already has meeting ID: {session.ZoomMeetingId}");
            }

            try 
            {
                await _sessionService.CreateZoomMeetingForSessionAsync(sessionId);
                
                // Reload session to get updated details
                session = await _sessionRepository.GetByIdAsync(sessionId);
                
                return Ok(new 
                { 
                    Message = "Zoom Meeting Created and Calendar Invites Sent", 
                    MeetingId = session.ZoomMeetingId, 
                    JoinUrl = session.VideoConferenceLink,
                    Password = session.ZoomMeetingPassword
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message, Stack = ex.StackTrace });
            }
        }

        /// <summary>
        /// Helper to generate a valid HMAC-SHA256 signature for testing webhooks manually.
        /// </summary>
        [HttpPost("generate-webhook-signature")]
        public IActionResult GenerateSignature([FromBody] SignatureRequest request)
        {
            if (string.IsNullOrEmpty(_zoomSettings.WebhookSecretToken))
                return BadRequest("WebhookSecretToken is not configured in appsettings.");

            var ts = request.Timestamp ?? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
            var msg = $"v0:{ts}:{request.Body}";

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_zoomSettings.WebhookSecretToken));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(msg));
            var signature = $"v0={BitConverter.ToString(hash).Replace("-", "").ToLower()}";

            return Ok(new { Signature = signature, Timestamp = ts });
        }

        public class SignatureRequest
        {
            public required string Body { get; set; }
            public string? Timestamp { get; set; }
        }

        public class FileUploadDto
        {
            public IFormFile File { get; set; }
        }


        /// <summary>
        /// Retry transcription for an existing session
        /// </summary>
        [HttpPost("retry-transcription/{sessionId}")]
        public async Task<IActionResult> RetryTranscription(string sessionId)
        {
            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null) return NotFound($"Session {sessionId} not found");
            
            if (!session.ZoomMeetingId.HasValue) 
                return BadRequest("Session has no Zoom meeting");

            try
            {
                // Call the session service to process recording
                await _sessionService.ProcessRecordingCompletedAsync(
                    session.ZoomMeetingId.Value, 
                    new List<ZoomRecordingFileDto>(), 
                    null);
                
                return Ok(new { Message = "Transcription retry initiated", SessionId = sessionId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message });
            }
        }

        /// <summary>
        /// Simulates the entire webhook flow: Upload -> R2 -> Deepgram -> DB Update.
        /// Allows verifying the integration pipeline without waiting for real Zoom webhooks.
        /// </summary>
        [HttpPost("simulate-webhook-flow/{sessionId}")]
        [DisableRequestSizeLimit]
        public async Task<IActionResult> SimulateFullFlow([FromRoute] string sessionId, [FromForm] FileUploadDto upload)
        {
            var file = upload?.File;
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded. Please use multipart/form-data with a 'file' key.");

            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null) return NotFound($"Session {sessionId} not found");

            try
            {
                // 1. Upload to R2
                var fileName = $"{sessionId}.mp4"; // Use session ID as standard naming
                using var stream = file.OpenReadStream();
                var key = await _blobStorageService.UploadAsync(stream, fileName, "video/mp4", file.Length);

                // Update Session with R2 Key
                session.VideoStorageKey = key;
                session.RecordingAvailableAt = DateTime.UtcNow;
                _sessionRepository.Update(session);
                await _sessionRepository.SaveChangesAsync();

                // 2. Generate Presigned URL
                var presignedUrl = _blobStorageService.GetPresignedUrl(key, TimeSpan.FromMinutes(60));

                // 3. Transcribe with Deepgram
                var transcript = await _deepgramService.TranscribeAudioUrlAsync(presignedUrl);

                // 4. Update Session with Transcript
                if (!string.IsNullOrEmpty(transcript))
                {
                    session.Transcript = transcript;
                    session.TranscriptProcessed = true;
                    _sessionRepository.Update(session);
                    await _sessionRepository.SaveChangesAsync();
                }

                return Ok(new 
                { 
                    Message = "Full flow simulation completed successfully",
                    SessionId = sessionId,
                    R2Key = key,
                    TranscriptPreview = transcript?.Substring(0, Math.Min(transcript.Length, 100)) + "...",
                    PresignedUrl = presignedUrl
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = ex.Message, StackTrace = ex.StackTrace });
            }
        }

        /// <summary>
        /// Inspects the internal state of a session to verify Zoom/Cloud integration flags.
        /// </summary>
        [HttpGet("inspect-session/{sessionId}")]
        public async Task<IActionResult> InspectSession(string sessionId)
        {
            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null) return NotFound($"Session {sessionId} not found");

            return Ok(new
            {
                SessionId = session.Id,
                Status = session.Status.ToString(),
                Zoom = new
                {
                    MeetingId = session.ZoomMeetingId,
                    HasPassword = !string.IsNullOrEmpty(session.ZoomMeetingPassword),
                    JoinUrl = session.VideoConferenceLink
                },
                Recording = new
                {
                    Processed = session.RecordingProcessed,
                    AvailableAt = session.RecordingAvailableAt,
                    StorageKey = session.VideoStorageKey,
                    HasPlayUrl = !string.IsNullOrEmpty(session.RecordingPlayUrl) // Legacy field
                },
                Transcript = new
                {
                    Processed = session.TranscriptProcessed,
                    HasContent = !string.IsNullOrEmpty(session.Transcript),
                    RetrievalAttempts = session.TranscriptRetrievalAttempts,
                    LastAttempt = session.LastTranscriptRetrievalAttempt
                }
            });
        }
    }
}
