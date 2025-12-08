using CareerRoute.API.Filters;
using CareerRoute.API.Models;
using CareerRoute.Core.Constants;
using CareerRoute.Core.DTOs.Payouts;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CareerRoute.API.Controllers
{
    /// <summary>
    /// Manages mentor balance operations including viewing balance information
    /// </summary>
    [Route("api/balance")]
    [ApiController]
    [Produces("application/json")]
    public class MentorBalanceController : ControllerBase
    {
        private readonly IMentorBalanceService _mentorBalanceService;
        private readonly ILogger<MentorBalanceController> _logger;

        public MentorBalanceController(
            IMentorBalanceService mentorBalanceService,
            ILogger<MentorBalanceController> logger)
        {
            _mentorBalanceService = mentorBalanceService;
            _logger = logger;
        }

        /// <summary>
        /// Get mentor balance information
        /// </summary>
        /// <param name="mentorId">Mentor ID</param>
        /// <returns>Mentor balance details including available, pending, and total earnings</returns>
        /// <response code="200">Returns the mentor balance</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User doesn't have permission to access this balance</response>
        /// <response code="404">Balance not found</response>
        /// <remarks>
        /// **Authorization:** Requires authenticated user with Mentor role.
        /// 
        /// Mentors can only access their own balance information.
        /// 
        /// **Balance Fields:**
        /// - **AvailableBalance**: Amount available for immediate payout withdrawal
        /// - **PendingBalance**: Amount from recently completed sessions held during the holding period
        /// - **TotalEarnings**: Cumulative sum of all earnings from completed sessions
        /// 
        /// All amounts are displayed in currency format with two decimal places.
        /// </remarks>
        [HttpGet("{mentorId}")]
        [AuthorizeRole(AppRoles.Mentor)]
        [ProducesResponseType(typeof(ApiResponse<MentorBalanceDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetMentorBalance(string mentorId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthenticatedException("Invalid authentication token");
            }

            // Ensure mentor can only access their own balance
            if (userId != mentorId)
            {
                _logger.LogWarning("User {UserId} attempted to access balance for mentor {MentorId}",
                    userId, mentorId);
                throw new UnauthorizedException("Access Denied");
            }

            _logger.LogInformation("Retrieving balance for mentor {MentorId}", mentorId);

            var balanceDto = await _mentorBalanceService.GetMentorBalanceAsync(mentorId);

            return Ok(new ApiResponse<MentorBalanceDto>(
                balanceDto,
                "Balance retrieved successfully"
            ));
        }
    }
}
