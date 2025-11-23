using CareerRoute.API.Models;
using CareerRoute.Core.Constants;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Sessions;
using CareerRoute.Core.DTOs.Zoom;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CareerRoute.API.Controllers
{
    /// <summary>
    /// Manages session operations including booking, rescheduling, recordings, and transcripts.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class SessionsController : ControllerBase
    {
        private readonly ISessionService _sessionService;
        private readonly ILogger<SessionsController> _logger;

        public SessionsController(ISessionService sessionService, ILogger<SessionsController> logger)
        {
            _sessionService = sessionService;
            _logger = logger;
        }

        /// <summary>
        /// Book a session with a mentor (Mentee only).
        /// </summary>
        [HttpPost]
        [Authorize(Policy = AppPolicies.RequireUserRole)]
        [ProducesResponseType(typeof(ApiResponse<BookSessionResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult> BookSession([FromBody] BookSessionRequestDto dto)
        {
            var menteeId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(menteeId))
                throw new UnauthenticatedException("Invalid authentication token");

            _logger.LogInformation("Mentee with Id {menteeId} requested to book a session", menteeId);

            var bookedSession = await _sessionService.BookSessionAsync(menteeId, dto);

            return Created(string.Empty, new ApiResponse<BookSessionResponseDto>(
                bookedSession,
                "Session booked successfully. Please proceed to payment to confirm your booking."
            ));
        }

        /// <summary>
        /// Retrieve detailed information about a specific session.
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Policy = AppPolicies.RequireAnyRole)]
        [ProducesResponseType(typeof(ApiResponse<SessionDetailsResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetSessionDetails([FromRoute] string id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(userId))
                throw new UnauthenticatedException("Invalid authentication token");

            _logger.LogInformation("User {UserId} with role {Role} requested details for session {SessionId}", userId, userRole, id);
            var sessionDetails = await _sessionService.GetSessionDetailsAsync(id, userId, userRole);

            return Ok(new ApiResponse<SessionDetailsResponseDto>(sessionDetails, "Session retrieved successfully"));
        }

        /// <summary>
        /// Retrieves the upcoming sessions for the authenticated user based on role.
        /// </summary>
        [HttpGet("upcoming")]
        [Authorize(Policy = AppPolicies.RequireAnyRole)]
        [ProducesResponseType(typeof(ApiResponse<UpcomingSessionsResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetUpcomingSessions([FromQuery] PaginationRequestDto request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthenticatedException("Invalid authentication token");
            }

            _logger.LogInformation("UserId {userId} with Role {userRole} requested upcoming sessions", userId, userRole);

            var response = await _sessionService.GetUpcomingSessionsAsync(userId, userRole, request.Page, request.PageSize);

            if (!response.Sessions.Any())
                return NotFound(ApiResponse.Error("No upcoming sessions found", 404));

            return Ok(new ApiResponse<UpcomingSessionsResponse>(response, "Upcoming sessions retrieved successfully"));
        }

        /// <summary>
        /// Retrieves a paginated list of past sessions for the authenticated user based on role.
        /// </summary>
        [HttpGet("past")]
        [Authorize(Policy = AppPolicies.RequireAnyRole)]
        [ProducesResponseType(typeof(ApiResponse<PastSessionsResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetPastSessions([FromQuery] PaginationRequestDto request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthenticatedException("Invalid authentication token");
            }

            _logger.LogInformation("UserId {userId} with Role {userRole} requested past sessions", userId, userRole);

            var response = await _sessionService.GetPastSessionsAsync(userId, userRole, request.Page, request.PageSize);

            if (!response.Sessions.Any())
                return NotFound(ApiResponse.Error("No past sessions found", 404));

            return Ok(new ApiResponse<PastSessionsResponse>(response, "Past sessions retrieved successfully"));
        }

        /// <summary>
        /// Submit a reschedule request for a session (Mentor or Mentee).
        /// </summary>
        [HttpPatch("{id}/reschedule")]
        [Authorize(Policy = AppPolicies.RequireAnyRole)]
        public async Task<ActionResult> RescheduleSession([FromRoute] string id, [FromBody] RescheduleSessionRequestDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthenticatedException("Invalid authentication token");
            }

            _logger.LogInformation("UserId {userId} with Role {userRole} requested rescheduling ", userId, userRole);

            var rescheduledSession = await _sessionService.RescheduleSessionAsync(id, dto, userId, userRole);

            return Ok(new ApiResponse<RescheduleSessionResponseDto>(
                rescheduledSession,
                "Reschedule request submitted successfully. Waiting for approval/Rejection from Email."
            ));
        }

        /// <summary>
        /// Approve a reschedule request (Mentor, Mentee, or Admin).
        /// </summary>
        [HttpPost("reschedule/{rescheduleId}/approve")]
        [Authorize(Policy = AppPolicies.RequireAnyRole)]
        [ProducesResponseType(typeof(ApiResponse<RescheduleSessionResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult> ApproveReschedule([FromRoute] string rescheduleId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(userId))
                throw new UnauthenticatedException("Invalid authentication token");

            _logger.LogInformation("UserId {userId} with Role {userRole} approving reschedule {rescheduleId}", userId, userRole, rescheduleId);

            var result = await _sessionService.ApproveRescheduleAsync(rescheduleId, userId, userRole);

            return Ok(new ApiResponse<RescheduleSessionResponseDto>(
                result,
                "Reschedule request approved successfully. Session has been updated."
            ));
        }

        /// <summary>
        /// Reject a reschedule request (Mentor, Mentee, or Admin).
        /// </summary>
        [HttpPost("reschedule/{rescheduleId}/reject")]
        [Authorize(Policy = AppPolicies.RequireAnyRole)]
        [ProducesResponseType(typeof(ApiResponse<RescheduleSessionResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult> RejectReschedule([FromRoute] string rescheduleId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(userId))
                throw new UnauthenticatedException("Invalid authentication token");

            _logger.LogInformation("UserId {userId} with Role {userRole} rejecting reschedule {rescheduleId}", userId, userRole, rescheduleId);

            var result = await _sessionService.RejectRescheduleAsync(rescheduleId, userId, userRole);

            return Ok(new ApiResponse<RescheduleSessionResponseDto>(
                result,
                "Reschedule request rejected successfully. Session remains at original time."
            ));
        }

        /// <summary>
        /// Cancel a session by the mentee, mentor, or admin.
        /// </summary>
        [HttpPatch("{id}/cancel")]
        [Authorize(Policy = AppPolicies.RequireAnyRole)]
        [ProducesResponseType(typeof(ApiResponse<CancelSessionResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult> CancelSession([FromRoute] string id, [FromBody] CancelSessionRequestDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthenticatedException("Invalid authentication token");
            }

            _logger.LogInformation("UserId {userId} with Role {userRole} requested cancelling ", userId, userRole);

            var cancelledSession = await _sessionService.CancelSessionAsync(id, dto, userId, userRole);

            return Ok(new ApiResponse<CancelSessionResponseDto>(
                cancelledSession,
                "Session cancelled successfully. Refund processed according to cancellation policy."
            ));
        }

        /// <summary>
        /// Provides join info for a participant to enter a session.
        /// </summary>
        [HttpPost("{id}/join")]
        [Authorize(Policy = AppPolicies.RequireAnyRole)]
        [ProducesResponseType(typeof(ApiResponse<JoinSessionResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status410Gone)]
        public async Task<ActionResult> JoinSession([FromRoute] string id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthenticatedException("Invalid authentication token");
            }

            _logger.LogInformation("UserId {userId} with Role {userRole} requested joining ", userId, userRole);

            var joinSession = await _sessionService.JoinSessionAsync(id, userId);

            return Ok(new ApiResponse<JoinSessionResponseDto>(
              joinSession,
              "Your video conference link retrieved successfully."
          ));
        }

        /// <summary>
        /// Marks a session as completed (Mentor or Admin only).
        /// </summary>
        [HttpPatch("{id}/complete")]
        [Authorize(Policy = AppPolicies.RequireMentorOrAdminRole)]
        [ProducesResponseType(typeof(ApiResponse<CompleteSessionResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult> CompleteSession(string id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthenticatedException("Invalid authentication token");
            }

            _logger.LogInformation("UserId {userId} with Role {userRole} marks completed ", userId, userRole);

            var completeSession = await _sessionService.CompleteSessionAsync(id, userId, userRole);

            return Ok(new ApiResponse<CompleteSessionResponseDto>(
              completeSession,
              "Session is marked completed successfully."
          ));
        }

        /// <summary>
        /// Get session recording (participants only).
        /// </summary>
        [HttpGet("{sessionId}/recording")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<SessionRecordingDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetSessionRecording(string sessionId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthenticatedException("Invalid authentication token");
            }

            _logger.LogInformation("User {UserId} requesting recording for session {SessionId}", userId, sessionId);

            var recording = await _sessionService.GetSessionRecordingAsync(sessionId, userId);

            return Ok(new ApiResponse<SessionRecordingDto>(
                recording,
                "Recording retrieved successfully"
            ));
        }

        /// <summary>
        /// Get session transcript (participants only).
        /// </summary>
        [HttpGet("{sessionId}/transcript")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetSessionTranscript(string sessionId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthenticatedException("Invalid authentication token");
            }

            _logger.LogInformation("User {UserId} requesting transcript for session {SessionId}", userId, sessionId);

            var transcript = await _sessionService.GetSessionTranscriptAsync(sessionId, userId);

            return Ok(new ApiResponse<string>(
                transcript,
                "Transcript retrieved successfully"
            ));
        }

        /// <summary>
        /// Ends an active session and its associated Zoom meeting (mentor only).
        /// </summary>
        [HttpPost("{sessionId}/end")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> EndSession(string sessionId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthenticatedException("Invalid authentication token");
            }

            _logger.LogInformation("User {UserId} requesting to end session {SessionId}", userId, sessionId);

            await _sessionService.EndSessionAsync(sessionId, userId);

            return Ok(new ApiResponse<string>(
                "Session ended successfully. All participants have been disconnected.",
                "Session ended successfully"
            ));
        }
    }
}
