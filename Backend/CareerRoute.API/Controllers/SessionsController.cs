using CareerRoute.API.Models;
using CareerRoute.Core.Domain.Entities;
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


        [Authorize(Roles = "User")] //Mentee
        public async Task<ActionResult> BookSession([FromBody] BookSessionRequestDto dto)
        {
            var menteeId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(menteeId))
            {
                return Unauthorized(ApiResponse.Error("Invalid authentication token", 401));
            }

            _logger.LogInformation("MenteeId {menteeId} requested to update their mentor profile", menteeId);

            var bookedSession = await _sessionService.BookSessionAsync(menteeId, dto);

            return Created(string.Empty, new ApiResponse<BookSessionResponseDto>(
                bookedSession,
                "Session booked successfully. Please proceed to payment to confirm your booking."
            ));
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "User,Mentor,Admin")]
        public async Task<ActionResult> GetSessionDetails(string id)
        {
            // Get current user info from JWT
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(userId))
                throw new UnauthenticatedException("Invalid authentication token");

            // Get session details
            var session = await _sessionService.GetSessionDetailsAsync(id);
            // Check if user is allowed: mentee, mentor, or admin
            var isParticipant = (userRole == "User" && session.MenteeId == userId) ||
                                (userRole == "Mentor" && session.MentorId == userId) ||
                                (userRole == "Admin");

            if (!isParticipant)
                throw new Core.Exceptions.UnauthorizedException("You don't have permission to view this session");

            return Ok(new ApiResponse<SessionDetailsResponseDto>(session, "Session retrieved successfully"));
        }
        [HttpGet("upcoming")]
        [Authorize(Roles = "User,Mentor")]
        public async Task<ActionResult> GetUpcomingSessions()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse.Error("Invalid authentication token", 401));
            }

            _logger.LogInformation("UserId {userId} with Role {userRole} requested upcoming sessions", userId, userRole);

            var upcomingSessions = await _sessionService.GetUpcomingSessionsAsync();

            return Ok(new ApiResponse<List<UpCommingSessionsResponseDto>>(
                upcomingSessions,
                "Upcoming sessions retrieved successfully"
            ));
        }

        [HttpGet("past")]
        [Authorize(Roles = "User,Mentor")]
        public async Task<ActionResult> GetPastSessions()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthenticatedException("Invalid authentication token");
            }

            _logger.LogInformation("UserId {userId} with Role {userRole} requested past sessions", userId, userRole);

            // Pass the necessary context (ID and Role) to the service for filtering
            var pastSessions = await _sessionService.GetPastSessionsAsync();

            return Ok(new ApiResponse<List<PastSessionsResponseDto>>(
                pastSessions,
                "Past sessions retrieved successfully"
            ));
        }

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


        [HttpPatch("{id}/cancel")]
        [Authorize(Roles = "User,Mentor,Admin")]
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

        [HttpPost("{id}/join")]
        [Authorize(Roles = "User,Mentor")]
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

        [HttpPatch("{id}/complete")]
        [Authorize(Roles = "Mentor,Admin")]
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




