using CareerRoute.API.Models;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Sessions;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SendGrid.Helpers.Errors.Model;
using System.Security.Claims;

namespace CareerRoute.API.Controllers
{
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
        /// <remarks>
        /// This endpoint allows an authenticated mentee to book a session by selecting an available time slot.
        /// The session is created in a Pending state and must be paid for to confirm the booking.
        /// 
        /// Validation includes:
        /// - Time slot must exist and not be already booked
        /// - Time slot must be at least 24 hours in the future
        /// - Mentor must exist
        /// - Mentee must not have overlapping sessions at the same time
        /// </remarks>
        /// <param name="dto">The session booking request containing the TimeSlotId and optional notes and topic.</param>
        /// <response code="201">Session booked successfully.</response>
        /// <response code="400">Invalid request data.</response>
        /// <response code="401">User not authenticated.</response>
        /// <response code="404">Time slot or mentor not found.</response>
        /// <response code="409">Conflict — time slot already booked or overlapping session exists.</response>


        [HttpPost]
        [Authorize(Roles = "User")] // Mentee
        [ProducesResponseType(typeof(ApiResponse<BookSessionResponseDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult> BookSession([FromBody] BookSessionRequestDto dto)
        {
            var menteeId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(menteeId))
            {
                return Unauthorized(ApiResponse.Error("Invalid authentication token", 401));
            }

            _logger.LogInformation("Mentee with Id {menteeId} requested to book a session", menteeId);

            var bookedSession = await _sessionService.BookSessionAsync(menteeId, dto);

            return Created(string.Empty, new ApiResponse<BookSessionResponseDto>(
                bookedSession,
                "Session booked successfully. Please proceed to payment to confirm your booking."
            ));
        }



        /// <summary>
        /// Retrieve detailed information about a specific session.
        /// Mentee, mentor, or admin can access this session.
        /// </summary>
        /// <param name="id">The unique identifier of the session.</param>
        /// <returns>Returns detailed session information including mentee, mentor, timing, status, and related data.</returns>
        /// <response code="200">Session retrieved successfully</response>
        /// <response code="401">User is not authenticated or JWT is invalid</response>
        /// <response code="403">User is not authorized to view this session</response>
        /// <response code="404">Session not found</response>
        [HttpGet("{id}")]
        [Authorize(Roles = "User,Mentor,Admin")]
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
        /// Retrieves the upcoming sessions for the authenticated user  based on role.
        /// </summary>
        /// <param name="request">Pagination parameters: page number and page size</param>
        /// <returns>
        /// Returns a paginated list of upcoming sessions filtered by:
        /// - Status: Confirmed or Pending
        /// - ScheduledStartTime: future sessions only
        /// Each session contains session details, mentor/mentee info, and hours until session.
        /// </returns>
        /// <response code="200">Upcoming sessions retrieved successfully</response>
        /// <response code="401">Unauthorized access</response>
        /// <response code="404">No upcoming sessions found</response>
         

        [HttpGet("upcoming")]
        [Authorize(Roles = "User,Mentor,Admin")]
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
        /// Returns a paginated list of past sessions filtered by:
        /// - Status: Completed or Cancelled
        /// - ScheduledStartTime: only past sessions
        /// Each session contains session details, mentor/mentee info, and a `hasReview` flag indicating whether a review exists.
        /// </remarks>
        /// <param name="request">Pagination parameters: page number and page size</param>
        /// <response code="200">Past sessions retrieved successfully</response>
        /// <response code="401">Unauthorized access</response>
        /// <response code="404">No past sessions found</response>

        [HttpGet("past")]
        [Authorize(Roles = "User,Mentor,Admin")]
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

            // Fetch all past sessions filtered by user
            var response = await _sessionService.GetPastSessionsAsync(userId, userRole, request.Page, request.PageSize);

            if (!response.Sessions.Any())
                return NotFound(ApiResponse.Error("No past sessions found", 404));

            return Ok(new ApiResponse<PastSessionsResponse>(response, "Past sessions retrieved successfully"));
        }




        /// <summary>
        /// Submit a reschedule request for a session (Mentor or Mentee).
        /// </summary>
        /// <remarks>
        /// This endpoint allows a session participant (mentee or mentor) to request a new time slot for an existing session.
        /// Upon successful request:
        /// - A reschedule record is created in a Pending state.
        /// - An email notification is sent to the other participant requesting approval.
        /// </remarks>
        /// <param name="id">The unique identifier of the session to reschedule.</param>
        /// <param name="dto">The reschedule request containing the new scheduled start time and optional notes.</param>
        /// <response code="200">Reschedule request submitted successfully and waiting for approval/rejection.</response>
        /// <response code="400">Invalid request data.</response>
        /// <response code="401">User not authenticated.</response>
        /// <response code="403">User is not authorized to reschedule this session.</response>
        /// <response code="404">Session not found.</response>
        /// <response code="409">Conflict — requested time slot unavailable for mentor or mentee.</response>

        [HttpPatch("{id}/reschedule")]
        [Authorize(Roles = "User,Mentor")]
        public async Task<ActionResult> RescheduleSession(
                [FromRoute] string id,
                [FromBody] RescheduleSessionRequestDto dto)
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
        /// Cancel a session by the mentee, mentor, or admin.
        /// </summary>
        /// <param name="id">The unique identifier of the session to cancel.</param>
        /// <param name="dto">Cancellation request containing the reason.</param>
        /// <response code="200">Session cancelled successfully. Refund processed according to policy.</response>
        /// <response code="400">Validation failed (e.g., reason too short).</response>
        /// <response code="401">User not authenticated or JWT invalid.</response>
        /// <response code="403">User not authorized to cancel this session.</response>
        /// <response code="404">Session not found or already completed.</response>
        /// <response code="409">Conflict — cancellation not allowed (e.g., already cancelled).</response>
        [HttpPatch("{id}/cancel")]
        [Authorize(Roles = "User,Mentor,Admin")]
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
        /// Allows a participant (mentee or mentor) to join a confirmed session via video conference.
        /// </summary>
        /// <param name="id">The unique identifier of the session to join.</param>
        /// <response code="200">Video conference link retrieved successfully.</response>
        /// <response code="401">User is not authenticated or JWT is invalid.</response>
        /// <response code="403">User is not a participant in this session.</response>
        /// <response code="404">Session not found.</response>
        /// <response code="409">Session has not started yet. You can join 15 minutes before scheduled time.</response>
        /// <response code="410">Session has ended and can no longer be joined.</response>
        [HttpPost("{id}/join")]
        [Authorize(Roles = "User,Mentor")]
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
        /// </remarks>
        /// <param name="id">The unique identifier of the session to mark as completed.</param>
        /// <response code="200">Session marked as completed successfully.</response>
        /// <response code="401">User is not authenticated or JWT is invalid.</response>
        /// <response code="403">Only the mentor or admin can mark the session as completed.</response>
        /// <response code="404">Session not found.</response>
        /// <response code="409">Session is already marked as completed.</response>
        [HttpPatch("{id}/complete")]
        [Authorize(Roles = "Mentor,Admin")]
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


    }
}




