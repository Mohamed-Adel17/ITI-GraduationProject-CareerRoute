using CareerRoute.API.Models;
using CareerRoute.Core.Constants;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Reviews;
using CareerRoute.Core.DTOs.Sessions;
using CareerRoute.Core.DTOs.Zoom;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Stripe;
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
        private readonly IReviewService _reviewService;

        private readonly ILogger<SessionsController> _logger;

        public SessionsController(ISessionService sessionService,IReviewService reviewService ,ILogger<SessionsController> logger)
        {
            _sessionService = sessionService;
            _reviewService = reviewService;
            _logger = logger;
        }

        /// <summary>
        /// Book a session with a mentor (Mentee only).
        /// </summary>
        /// <remarks>
        /// Creates a new session booking request between the authenticated mentee and a mentor.
        /// The session will be in pending state until payment is completed.
        /// 
        /// **Required fields:**
        /// - MentorId: The ID of the mentor to book
        /// - TimeSlotId: The selected availability slot
        /// - SessionDuration: Duration in minutes (30 or 60)
        /// 
        /// **Flow:**
        /// 1. Session is created with Pending status
        /// 2. User must complete payment to confirm booking
        /// 3. Upon successful payment, session status changes to Confirmed
        /// </remarks>
        /// <param name="dto">Session booking details including mentor ID, time slot, and duration</param>
        /// <returns>Booked session details with payment instructions</returns>
        /// <response code="201">Session booked successfully, pending payment</response>
        /// <response code="400">Invalid booking request or validation failed</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="404">Mentor or time slot not found</response>
        /// <response code="409">Time slot already booked or scheduling conflict</response>
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
        /// <remarks>
        /// Returns comprehensive session details including:
        /// - Session status and timing information
        /// - Mentor and mentee details
        /// - Zoom meeting information (if available)
        /// - Payment status
        /// 
        /// **Authorization:** Only session participants (mentor/mentee) or admins can view session details.
        /// </remarks>
        /// <param name="id">The unique session identifier</param>
        /// <returns>Complete session details</returns>
        /// <response code="200">Session details retrieved successfully</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User is not a participant of this session</response>
        /// <response code="404">Session not found</response>
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
        /// <remarks>
        /// Returns paginated list of future sessions for the authenticated user.
        /// 
        /// **For Mentees:** Returns sessions where they are the participant
        /// **For Mentors:** Returns sessions where they are the host
        /// **For Admins:** Returns all upcoming sessions
        /// 
        /// Sessions are ordered by scheduled time (earliest first).
        /// </remarks>
        /// <param name="request">Pagination parameters (page number and page size)</param>
        /// <returns>Paginated list of upcoming sessions</returns>
        /// <response code="200">Upcoming sessions retrieved successfully</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="404">No upcoming sessions found</response>
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
        /// <remarks>
        /// Returns paginated list of completed or cancelled sessions for the authenticated user.
        /// 
        /// **For Mentees:** Returns past sessions where they were the participant
        /// **For Mentors:** Returns past sessions where they were the host
        /// **For Admins:** Returns all past sessions
        /// 
        /// Sessions are ordered by scheduled time (most recent first).
        /// Includes session recordings and transcripts if available.
        /// </remarks>
        /// <param name="request">Pagination parameters (page number and page size)</param>
        /// <returns>Paginated list of past sessions</returns>
        /// <response code="200">Past sessions retrieved successfully</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="404">No past sessions found</response>
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
        /// <remarks>
        /// Allows session participants to request a time change for an upcoming session.
        /// 
        /// **Flow:**
        /// 1. Requester submits new proposed time
        /// 2. Other participant receives email notification
        /// 3. Other participant approves or rejects via email link
        /// 4. If approved, session time is updated and Zoom meeting rescheduled
        /// 
        /// **Restrictions:**
        /// - Cannot reschedule completed or cancelled sessions
        /// - Cannot reschedule sessions that start within 24 hours
        /// - Only one pending reschedule request allowed per session
        /// </remarks>
        /// <param name="id">The unique session identifier</param>
        /// <param name="dto">Reschedule request details including new proposed time</param>
        /// <returns>Reschedule request confirmation with pending status</returns>
        /// <response code="200">Reschedule request submitted successfully</response>
        /// <response code="400">Invalid reschedule request or validation failed</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User is not a participant of this session</response>
        /// <response code="404">Session not found</response>
        /// <response code="409">Pending reschedule request already exists or scheduling conflict</response>
        [HttpPatch("{id}/reschedule")]
        [Authorize(Policy = AppPolicies.RequireAnyRole)]
        [ProducesResponseType(typeof(ApiResponse<RescheduleSessionResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
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
        /// <remarks>
        /// Approves a pending reschedule request, updating the session to the new proposed time.
        /// 
        /// **Effects:**
        /// - Session time is updated to the new proposed time
        /// - Zoom meeting is rescheduled automatically
        /// - Both participants receive confirmation emails
        /// - Calendar invites are updated
        /// 
        /// **Authorization:** Only the non-requesting participant or admin can approve.
        /// </remarks>
        /// <param name="rescheduleId">The unique reschedule request identifier</param>
        /// <returns>Updated session details with new schedule</returns>
        /// <response code="200">Reschedule request approved and session updated</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User cannot approve this reschedule request</response>
        /// <response code="404">Reschedule request not found</response>
        /// <response code="409">Reschedule request already processed or expired</response>
        /// <summary>
        /// Gets reschedule request details for approval page
        /// </summary>
        [HttpGet("reschedule/{rescheduleId}")]
        [Authorize(Policy = AppPolicies.RequireAnyRole)]
        [ProducesResponseType(typeof(ApiResponse<RescheduleDetailsDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetRescheduleDetails([FromRoute] string rescheduleId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(userId))
                throw new UnauthenticatedException("Invalid authentication token");

            var result = await _sessionService.GetRescheduleDetailsAsync(rescheduleId, userId, userRole);

            return Ok(new ApiResponse<RescheduleDetailsDto>(result, "Reschedule details retrieved successfully."));
        }

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
        /// <remarks>
        /// Rejects a pending reschedule request, keeping the session at its original time.
        /// 
        /// **Effects:**
        /// - Session remains at original scheduled time
        /// - Requester receives rejection notification email
        /// - Reschedule request is marked as rejected
        /// 
        /// **Authorization:** Only the non-requesting participant or admin can reject.
        /// </remarks>
        /// <param name="rescheduleId">The unique reschedule request identifier</param>
        /// <returns>Session details confirming original schedule maintained</returns>
        /// <response code="200">Reschedule request rejected successfully</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User cannot reject this reschedule request</response>
        /// <response code="404">Reschedule request not found</response>
        /// <response code="409">Reschedule request already processed or expired</response>
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
        /// <remarks>
        /// Cancels an upcoming session with refund processing based on cancellation policy.
        /// 
        /// **Cancellation Policy:**
        /// - More than 48 hours before: Full refund
        /// - 24-48 hours before: 50% refund
        /// - Less than 24 hours: No refund
        /// 
        /// **Effects:**
        /// - Session status changed to Cancelled
        /// - Zoom meeting is deleted
        /// - Refund processed according to policy
        /// - Both participants notified via email
        /// - Time slot becomes available again
        /// </remarks>
        /// <param name="id">The unique session identifier</param>
        /// <param name="dto">Cancellation details including reason</param>
        /// <returns>Cancellation confirmation with refund details</returns>
        /// <response code="200">Session cancelled successfully</response>
        /// <response code="400">Invalid cancellation request</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User is not authorized to cancel this session</response>
        /// <response code="404">Session not found</response>
        /// <response code="409">Session already completed or cancelled</response>
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
        /// <remarks>
        /// Returns the Zoom meeting join URL for the authenticated participant.
        /// 
        /// **Join Window:**
        /// - Participants can join up to 10 minutes before the scheduled time
        /// - Join URL expires after the session ends
        /// 
        /// **Returns different URLs based on role:**
        /// - Mentor: Host URL with meeting controls
        /// - Mentee: Participant URL
        /// 
        /// **Authorization:** Only session participants can retrieve join information.
        /// </remarks>
        /// <param name="id">The unique session identifier</param>
        /// <returns>Zoom meeting join URL and session details</returns>
        /// <response code="200">Join URL retrieved successfully</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User is not a participant of this session</response>
        /// <response code="404">Session not found</response>
        /// <response code="409">Session not in joinable state (not confirmed or already completed)</response>
        /// <response code="410">Session has ended or been cancelled</response>
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
        /// <remarks>
        /// Manually marks a session as completed, triggering post-session workflows.
        /// 
        /// **Effects:**
        /// - Session status changed to Completed
        /// - Recording and transcript processing initiated (if enabled)
        /// - Review request sent to mentee
        /// - Mentor payment processed
        /// 
        /// **Note:** Sessions are automatically completed when the scheduled end time passes,
        /// but this endpoint allows early completion if the session ends before scheduled time.
        /// 
        /// **Authorization:** Only the session mentor or admin can mark session as complete.
        /// </remarks>
        /// <param name="id">The unique session identifier</param>
        /// <returns>Completion confirmation with session summary</returns>
        /// <response code="200">Session marked as completed successfully</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User is not the mentor or admin for this session</response>
        /// <response code="404">Session not found</response>
        /// <response code="409">Session not in completable state (not started or already completed)</response>
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
                _logger.LogInformation("UserId {userId} with Role {userRole} marks completed ", userId, userRole);

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
        /// <remarks>
        /// Retrieves the Zoom cloud recording for a completed session.
        /// 
        /// **Availability:**
        /// - Recordings are available after session completion
        /// - Processing may take a few minutes after session ends
        /// - Recordings are retained for 30 days
        /// 
        /// **Recording includes:**
        /// - Video recording URL
        /// - Audio-only recording URL
        /// - Recording duration and file size
        /// 
        /// **Authorization:** Only session participants can access recordings.
        /// </remarks>
        /// <param name="sessionId">The unique session identifier</param>
        /// <returns>Recording URLs and metadata</returns>
        /// <response code="200">Recording retrieved successfully</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User is not a participant of this session</response>
        /// <response code="404">Session or recording not found</response>
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
        /// <remarks>
        /// Retrieves the auto-generated transcript for a completed session.
        /// 
        /// **Availability:**
        /// - Transcripts are generated from Zoom's audio transcription
        /// - Processing may take several minutes after session ends
        /// - Available only if transcription was enabled for the meeting
        /// 
        /// **Format:**
        /// - Returns plain text transcript
        /// - Includes speaker labels when available
        /// - Timestamps may be included
        /// 
        /// **Authorization:** Only session participants can access transcripts.
        /// </remarks>
        /// <param name="sessionId">The unique session identifier</param>
        /// <returns>Session transcript text</returns>
        /// <response code="200">Transcript retrieved successfully</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User is not a participant of this session</response>
        /// <response code="404">Session or transcript not found</response>
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
        /// Get AI-generated summary for a completed session (participants only).
        /// </summary>
        /// <remarks>
        /// Retrieves the AI-generated summary for a completed session.
        /// 
        /// **Availability:**
        /// - Summary is generated automatically after transcript is processed
        /// - Processing may take a few minutes after transcript is available
        /// 
        /// **Format:**
        /// - Returns markdown-formatted summary
        /// - Includes session overview, key advice, action items, and takeaways
        /// 
        /// **Authorization:** Only session participants can access summaries.
        /// </remarks>
        /// <param name="sessionId">The unique session identifier</param>
        /// <returns>AI-generated session summary in markdown format</returns>
        /// <response code="200">Summary retrieved successfully</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User is not a participant of this session</response>
        /// <response code="404">Session, transcript, or summary not found</response>
        [HttpGet("{sessionId}/summary")]
        [Authorize]
        [Produces("text/plain")]
        [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetSessionSummary(string sessionId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthenticatedException("Invalid authentication token");
            }

            _logger.LogInformation("User {UserId} requesting summary for session {SessionId}", userId, sessionId);

            var summary = await _sessionService.GetSessionSummaryAsync(sessionId, userId);

            return Content(summary, "text/plain");
        }

        /// <summary>
        /// Generate AI preparation guide for an upcoming session (mentor only).
        /// </summary>
        /// <remarks>
        /// Generates an AI-powered preparation guide to help the mentor prepare for the session.
        /// 
        /// **What's Generated:**
        /// - Key talking points based on session topic
        /// - Suggested questions to ask the mentee
        /// - Topics/resources to review beforehand
        /// - Potential challenges the mentee might face
        /// - Suggested session structure
        /// 
        /// **Behavior:**
        /// - If already generated, returns existing guide (WasAlreadyGenerated=true)
        /// - If topic/notes empty, provides general guidance with note to clarify with mentee
        /// 
        /// **Authorization:** Only the session mentor can generate preparation guides.
        /// </remarks>
        /// <param name="sessionId">The unique session identifier</param>
        /// <returns>AI-generated preparation guide</returns>
        /// <response code="200">Preparation guide generated or retrieved successfully</response>
        /// <response code="400">Session is completed, cancelled, or no-show</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User is not the mentor for this session</response>
        /// <response code="404">Session not found</response>
        [HttpPost("{sessionId}/generate-preparation")]
        [Authorize(Policy = AppPolicies.RequireMentorOrAdminRole)]
        [ProducesResponseType(typeof(ApiResponse<GeneratePreparationResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GeneratePreparation(string sessionId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                throw new UnauthenticatedException("Invalid authentication token");

            _logger.LogInformation("Mentor {UserId} requesting AI preparation for session {SessionId}", userId, sessionId);

            var result = await _sessionService.GeneratePreparationAsync(sessionId, userId);

            var message = result.WasAlreadyGenerated
                ? "Preparation guide retrieved successfully (previously generated)"
                : "Preparation guide generated successfully";

            return Ok(new ApiResponse<GeneratePreparationResponseDto>(result, message));
        }

        /// <summary>
        /// Ends an active session and its associated Zoom meeting (mentor only).
        /// </summary>
        /// <remarks>
        /// Immediately ends an ongoing session and disconnects all Zoom meeting participants.
        /// 
        /// **Effects:**
        /// - Zoom meeting is ended for all participants
        /// - Session status updated to reflect end time
        /// - Recording processing begins (if enabled)
        /// - Session can then be marked as completed
        /// 
        /// **Use cases:**
        /// - Session finished early
        /// - Technical issues requiring restart
        /// - Emergency session termination
        /// 
        /// **Authorization:** Only the session mentor can end the meeting.
        /// </remarks>
        /// <param name="sessionId">The unique session identifier</param>
        /// <returns>Confirmation that session has ended</returns>
        /// <response code="200">Session ended successfully</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User is not the mentor for this session</response>
        /// <response code="404">Session not found or no active meeting</response>
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



        /// <summary>
        /// Add a review for a completed session (Mentee only).
        /// </summary>
        /// <remarks>
        /// Allows the authenticated mentee to submit a review (rating &amp; comment) for a session
        /// they attended. Only one review is allowed per session.
        ///
        /// <b>Rules:</b><br/>
        /// - You must be the mentee who attended the session.<br/>
        /// - Session must be completed.<br/>
        /// - You cannot review the same session twice.<br/><br/>
        ///
        /// <b>Required fields:</b><br/>
        /// - Rating: A numeric score (1–5)<br/>
        /// - Comment: Optional written feedback<br/>
        /// </remarks>
        /// <param name="sessionId">ID of the session to review.</param>
        /// <param name="dto">Review details including rating and comment.</param>
        /// <returns>Created review details wrapped in ApiResponse.</returns>
        /// <response code="201">Review created successfully.</response>
        /// <response code="400">Invalid data or business rule violated.</response>
        /// <response code="401">User not authenticated.</response>
        /// <response code="403">User not allowed to review this session.</response>
        /// <response code="404">Session not found.</response>
        /// <response code="409">A review for this session already exists.</response>

        [HttpPost("{sessionId}/reviews")]
        [Authorize(Policy = AppPolicies.RequireUserRole)]
        [ProducesResponseType(typeof(ApiResponse<CreateReviewResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult> AddReview([FromRoute] string sessionId, [FromBody] CreateReviewRequestDto dto)
        {
            var menteeId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            _logger.LogInformation("Mentee {MenteeId} requested to add review for session {SessionId}", menteeId, sessionId);

            if (string.IsNullOrEmpty(menteeId))
                throw new UnauthenticatedException("Invalid authentication token");

            var review = await _reviewService.AddReviewAsync(sessionId, menteeId, dto);

            return Created(string.Empty, new ApiResponse<CreateReviewResponseDto>(
                review,
                "Review added successfully."
            ));
        }


    }
}
