using CareerRoute.Core.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CareerRoute.Core.Domain.Entities
{
    public class Notification
    {
        public required string Id { get; set; }

        [Required]
        public required string UserId { get; set; }

        [Required]
        public NotificationType Type { get; set; }

        [Required, MaxLength(200)]
        public required string Title { get; set; }

        [Required, MaxLength(1000)]
        public required string Message { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(500)]
        public string? ActionUrl { get; set; }

        // Navigation property
        public virtual ApplicationUser User { get; set; } = null!;
    }
}
