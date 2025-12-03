using CareerRoute.API.Filters;
using CareerRoute.API.Models;
using CareerRoute.Core.Constants;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Payouts;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CareerRoute.API.Controllers
{
    [Route("api/payouts")]
    [ApiController]
    [Produces("application/json")]
    public class PayoutController : ControllerBase
    {
        private readonly IPayoutService _payoutService;
        private readonly ILogger<PayoutController> _logger;

        public PayoutController(
            IPayoutService payoutService,
            ILogger<PayoutController> logger)
        {
            _payoutService = payoutService;
            _logger = logger;
        }

        [HttpPost("mentors/{mentorId}")]
        [AuthorizeRole(AppRoles.Mentor)]
        [ProducesResponseType(typeof(ApiResponse<PayoutDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult> RequestPayout(string mentorId, [FromBody] PayoutRequestDto request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthenticatedException("Invalid authentication token");
            }

            if (userId != mentorId)
            {
                _logger.LogWarning("User {UserId} attempted to request payout for mentor {MentorId}",
                    userId, mentorId);
                throw new UnauthorizedException("Access Denied");
            }

            _logger.LogInformation("Processing payout request for mentor {MentorId}, amount {Amount}",
                mentorId, request.Amount);

            var payout = await _payoutService.RequestPayoutAsync(mentorId, request);

            return Ok(new ApiResponse<PayoutDto>(payout, "Payout request created successfully"));
        }


        [HttpGet("mentors/{mentorId}")]
        [AuthorizeRole(AppRoles.Mentor)]
        [ProducesResponseType(typeof(ApiResponse<PayoutHistoryResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult> GetPayoutHistory(
            string mentorId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthenticatedException("Invalid authentication token");
            }

            if (userId != mentorId)
            {
                _logger.LogWarning("User {UserId} attempted to access payout history for mentor {MentorId}",
                    userId, mentorId);
                throw new UnauthorizedException("Access Denied");
            }
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 50);

            _logger.LogInformation("Retrieving payout history for mentor {MentorId}, page {Page}, pageSize {PageSize}",
                mentorId, page, pageSize);

            var result = await _payoutService.GetPayoutHistoryAsync(mentorId, page, pageSize);

            return Ok(new ApiResponse<PayoutHistoryResponseDto>(result, "Payout history retrieved successfully"));
        }

        [HttpGet("{payoutId}")]
        [AuthorizeRole(AppRoles.Admin, AppRoles.Mentor)]
        [ProducesResponseType(typeof(ApiResponse<PayoutDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetPayoutDetails(string payoutId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var role = User.FindFirstValue(ClaimTypes.Role)!;

            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthenticatedException("Invalid authentication token");
            }

            _logger.LogInformation("Retrieving payout details for payout {PayoutId}", payoutId);

            var payout = await _payoutService.GetPayoutDetailsAsync(payoutId, userId, role);

            return Ok(new ApiResponse<PayoutDto>(payout, "Payout details retrieved successfully"));
        }

        [HttpPost("{payoutId}/process")]
        [AuthorizeRole(AppRoles.Admin)]
        [ProducesResponseType(typeof(ApiResponse<PayoutDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> ProcessPayout(string payoutId)
        {
            _logger.LogInformation("Admin processing payout {PayoutId}", payoutId);

            var payout = await _payoutService.ProcessPayoutAsync(payoutId);


            var message = payout.Status == PayoutStatus.Completed
                ? "Payout processed successfully"
                : "Payout processing failed";

            return Ok(new ApiResponse<PayoutDto>(payout, message));
        }

        [HttpPost("{payoutId}/cancel")]
        [AuthorizeRole(AppRoles.Admin)]
        [ProducesResponseType(typeof(ApiResponse<PayoutDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> CancelPayout(string payoutId)
        {
            _logger.LogInformation("Admin cancelling payout {PayoutId}", payoutId);

            var payout = await _payoutService.CancelPayoutAsync(payoutId);

            return Ok(new ApiResponse<PayoutDto>(payout, "Payout cancelled successfully"));
        }

        [HttpGet("admin")]
        [AuthorizeRole(AppRoles.Admin)]
        [ProducesResponseType(typeof(ApiResponse<AdminPayoutListResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult> GetAllPayoutsForAdmin([FromQuery] AdminPayoutFilterDto filter)
        {
            _logger.LogInformation("Admin retrieving payouts with filters");

            filter.Page = Math.Max(1, filter.Page);
            filter.PageSize = Math.Clamp(filter.PageSize, 1, 100);

            var result = await _payoutService.GetAllPayoutsForAdminAsync(filter);

            return Ok(new ApiResponse<AdminPayoutListResponseDto>(result, "Payouts retrieved successfully"));
        }
    }
}
