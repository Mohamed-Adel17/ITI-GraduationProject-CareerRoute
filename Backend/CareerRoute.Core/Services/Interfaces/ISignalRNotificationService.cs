using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Notifications;

namespace CareerRoute.Core.Services.Interfaces
{
    /// <summary>
    /// Service for managing user notifications including real-time delivery via SignalR.
    /// </summary>
    public interface ISignalRNotificationService
    {
        /// <summary>
        /// Creates and sends a notification to a user, persisting it to the database
        /// and broadcasting via SignalR for real-time delivery.
        /// </summary>
        /// <param name="userId">The target user's ID</param>
        /// <param name="type">The type of notification</param>
        /// <param name="title">The notification title</param>
        /// <param name="message">The notification message</param>
        /// <param name="actionUrl">Optional URL for navigation when notification is clicked</param>
        Task SendNotificationAsync(string userId, NotificationType type, string title, string message, string? actionUrl = null);
    }
}
