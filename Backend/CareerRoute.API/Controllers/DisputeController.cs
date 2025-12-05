using CareerRoute.API.Filters;
using CareerRoute.API.Models;
using CareerRoute.Core.Constants;
using CareerRoute.Core.DTOs.Disputes;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CareerRoute.API.Controllers
{
    [Route("api/disputes")]
    [ApiController]
    [Produces("application/json")]
    public class DisputeController : ControllerBase
    {
        private readonly ISessionDisputeService _disputeService;
        private readonly ILogger<DisputeController> _logger;

        public DisputeController(ISessionDisputeService disputeService, ILogger<DisputeController> logger)
        {
            _disputeService = disputeService;
            _logger = logger;
        }

        /// <summary>
        /// Create a dispute for a completed session (Mentee only, within 3-day window)
        /// </summary>
        [HttpPost("sessions/{sessionId}")]
        [AuthorizeRole(AppRoles.User)]
        [ProducesResponseType(typeof(ApiResponse<DisputeDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> CreateDispute(string sessionId, [FromBody] CreateDisputeDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                throw new UnauthenticatedException("Invalid authentication token");

            var dispute = await _disputeService.CreateDisputeAsync(sessionId, userId, dto);
            return Ok(new ApiResponse<DisputeDto>(dispute, "Dispute created successfully"));
        }

        /// <summary>
        /// Get dispute for a session (Mentee, Mentor of session, or Admin)
        /// </summary>
        [HttpGet("sessions/{sessionId}")]
        [AuthorizeRole(AppRoles.User, AppRoles.Mentor, AppRoles.Admin)]
        [ProducesResponseType(typeof(ApiResponse<DisputeDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetDisputeBySession(string sessionId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var role = User.FindFirstValue(ClaimTypes.Role) ?? "";

            var dispute = await _disputeService.GetDisputeBySessionIdAsync(sessionId, userId!, role);
            if (dispute == null)
                return Ok(new ApiResponse<DisputeDto?>(null, "No dispute found for this session"));

            return Ok(new ApiResponse<DisputeDto>(dispute, "Dispute retrieved successfully"));
        }

        /// <summary>
        /// Get dispute by ID (Admin only)
        /// </summary>
        [HttpGet("{disputeId}")]
        [AuthorizeRole(AppRoles.Admin)]
        [ProducesResponseType(typeof(ApiResponse<DisputeDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetDisputeById(string disputeId)
        {
            var dispute = await _disputeService.GetDisputeByIdAsync(disputeId);
            return Ok(new ApiResponse<DisputeDto>(dispute, "Dispute retrieved successfully"));
        }

        /// <summary>
        /// Resolve a dispute (Admin only)
        /// </summary>
        [HttpPost("{disputeId}/resolve")]
        [AuthorizeRole(AppRoles.Admin)]
        [ProducesResponseType(typeof(ApiResponse<AdminDisputeDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> ResolveDispute(string disputeId, [FromBody] ResolveDisputeDto dto)
        {
            var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(adminId))
                throw new UnauthenticatedException("Invalid authentication token");

            var dispute = await _disputeService.ResolveDisputeAsync(disputeId, adminId, dto);
            return Ok(new ApiResponse<AdminDisputeDto>(dispute, "Dispute resolved successfully"));
        }

        /// <summary>
        /// Get all disputes with filtering (Admin only)
        /// </summary>
        [HttpGet("admin")]
        [AuthorizeRole(AppRoles.Admin)]
        [ProducesResponseType(typeof(ApiResponse<AdminDisputeListResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetAllDisputes([FromQuery] AdminDisputeFilterDto filter)
        {
            filter.Page = Math.Max(1, filter.Page);
            filter.PageSize = Math.Clamp(filter.PageSize, 1, 100);

            var result = await _disputeService.GetAllDisputesForAdminAsync(filter);
            return Ok(new ApiResponse<AdminDisputeListResponseDto>(result, "Disputes retrieved successfully"));
        }
    }
}
