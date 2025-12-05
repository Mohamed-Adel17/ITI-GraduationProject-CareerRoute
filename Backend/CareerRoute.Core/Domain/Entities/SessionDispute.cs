using CareerRoute.Core.Domain.Enums;

namespace CareerRoute.Core.Domain.Entities
{
    public class SessionDispute
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string SessionId { get; set; } = string.Empty;
        public string MenteeId { get; set; } = string.Empty;
        public DisputeReason Reason { get; set; }
        public string? Description { get; set; }
        public DisputeStatus Status { get; set; } = DisputeStatus.Pending;
        public DisputeResolution? Resolution { get; set; }
        public decimal? RefundAmount { get; set; }
        public string? AdminNotes { get; set; }
        public string? ResolvedById { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ResolvedAt { get; set; }

        // Navigation properties
        public virtual Session Session { get; set; } = null!;
        public virtual ApplicationUser Mentee { get; set; } = null!;
        public virtual ApplicationUser? ResolvedBy { get; set; }
    }
}
