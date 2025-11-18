using CareerRoute.API.Models;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.DTOs.Sessions;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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

            var bookedSession = await _sessionService.BookSessionByIdAsync(menteeId, dto);

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

            if (session == null)
                throw new NotFoundException("Session", id);

            // Check if user is allowed: mentee, mentor, or admin
            var isParticipant = (userRole == "User" && session.MenteeId == userId) ||
                                (userRole == "Mentor" && session.MentorId == userId) ||
                                (userRole == "Admin");

            if (!isParticipant)
                throw new UnauthorizedException("You don't have permission to view this session");

            return Ok(new ApiResponse<SessionDetailsResponseDto>(session, "Session retrieved successfully"));
        }
    }

}

