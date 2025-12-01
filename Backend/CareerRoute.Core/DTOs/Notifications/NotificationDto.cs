using CareerRoute.Core.Domain.Enums;

namespace CareerRoute.Core.DTOs.Notifications
{
    public class NotificationDto
    {
        public string Id { get; set; } = string.Empty;
        public NotificationType Type { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? ActionUrl { get; set; }
    }
}
