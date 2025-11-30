using CareerRoute.Core.DTOs.Notifications;

namespace CareerRoute.Core.Services.Interfaces
{
    public interface INotificationService
    {

        /// <summary>
        /// Retrieves a paginated list of notifications for a user, sorted by creation date descending.
        /// </summary>
        /// <param name="userId">The user's ID</param>
        /// <param name="page">Page number (1-based)</param>
        /// <param name="pageSize">Number of items per page</param>
        /// <returns>Paginated notification list with metadata</returns>
        Task<NotificationListResponseDto> GetUserNotificationsAsync(string userId, int page, int pageSize);

        /// <summary>
        /// Gets the count of unread notifications for a user.
        /// </summary>
        /// <param name="userId">The user's ID</param>
        /// <returns>Number of unread notifications</returns>
        Task<int> GetUnreadCountAsync(string userId);

        /// <summary>
        /// Marks a specific notification as read.
        /// </summary>
        /// <param name="notificationId">The notification ID</param>
        /// <param name="userId">The user's ID (for authorization)</param>
        Task MarkAsReadAsync(string notificationId, string userId);

        /// <summary>
        /// Marks all notifications for a user as read.
        /// </summary>
        /// <param name="userId">The user's ID</param>
        Task MarkAllAsReadAsync(string userId);

    }
}
