using CareerRoute.API.Models;
using CareerRoute.Core.Constants;
using CareerRoute.Core.DTOs.Notifications;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CareerRoute.API.Controllers
{
    /// <summary>
    /// Manages user notifications including retrieval, marking as read, and unread counts.
    /// </summary>
    [Route("api/notifications")]
    [ApiController]
    [Authorize]
    [Produces("application/json")]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(INotificationService notificationService, ILogger<NotificationsController> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves a paginated list of notifications for the authenticated user.
        /// </summary>
        /// <remarks>
        /// Returns notifications sorted by creation date descending (newest first).
        /// 
        /// **Pagination:**
        /// - Default page size is 10
        /// - Maximum page size is 50
        /// </remarks>
        /// <param name="page">Page number (1-based, default: 1)</param>
        /// <param name="pageSize">Number of items per page (default: 10, max: 50)</param>
        /// <returns>Paginated list of notifications with metadata</returns>
        /// <response code="200">Notifications retrieved successfully</response>
        /// <response code="401">User not authenticated</response>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<NotificationListResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult> GetNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                throw new UnauthorizedException("Access Denied");

            // Validate and constrain pagination parameters
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 50);

            _logger.LogInformation("User {UserId} requested notifications (page: {Page}, pageSize: {PageSize})", userId, page, pageSize);

            var notifications = await _notificationService.GetUserNotificationsAsync(userId, page, pageSize);

            return Ok(new ApiResponse<NotificationListResponseDto>(notifications, "Notifications retrieved successfully"));
        }

        /// <summary>
        /// Gets the count of unread notifications for the authenticated user.
        /// </summary>
        /// <returns>Unread notification count</returns>
        /// <response code="200">Unread count retrieved successfully</response>
        /// <response code="401">User not authenticated</response>
        [HttpGet("unread-count")]
        [ProducesResponseType(typeof(ApiResponse<UnreadCountResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult> GetUnreadCount()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                throw new UnauthorizedException("Access Denied");

            _logger.LogInformation("User {UserId} requested unread notification count", userId);

            var count = await _notificationService.GetUnreadCountAsync(userId);

            return Ok(new ApiResponse<UnreadCountResponseDto>(
                new UnreadCountResponseDto { UnreadCount = count },
                "Unread count retrieved successfully"
            ));
        }

        /// <summary>
        /// Marks a specific notification as read.
        /// </summary>
        /// <param name="id">The notification ID</param>
        /// <returns>Success confirmation</returns>
        /// <response code="200">Notification marked as read</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">Notification belongs to another user</response>
        /// <response code="404">Notification not found</response>
        [HttpPut("{id}/read")]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> MarkAsRead([FromRoute] string id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                throw new UnauthorizedException("Access Denied");

            _logger.LogInformation("User {UserId} marking notification {NotificationId} as read", userId, id);

            await _notificationService.MarkAsReadAsync(id, userId);

            return Ok(new ApiResponse { Success = true, Message = "Notification marked as read" });
        }

        /// <summary>
        /// Marks all notifications as read for the authenticated user.
        /// </summary>
        /// <returns>Success confirmation</returns>
        /// <response code="200">All notifications marked as read</response>
        /// <response code="401">User not authenticated</response>
        [HttpPut("read-all")]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult> MarkAllAsRead()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                throw new UnauthorizedException("Access Denied");

            _logger.LogInformation("User {UserId} marking all notifications as read", userId);

            await _notificationService.MarkAllAsReadAsync(userId);

            return Ok(new ApiResponse { Success = true, Message = "All notifications marked as read" });
        }
    }
}
