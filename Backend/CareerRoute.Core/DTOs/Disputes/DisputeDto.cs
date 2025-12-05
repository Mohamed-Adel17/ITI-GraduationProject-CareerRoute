using CareerRoute.Core.Domain.Enums;

namespace CareerRoute.Core.DTOs.Disputes
{
    public class DisputeDto
    {
        public string Id { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public string MenteeId { get; set; } = string.Empty;
        public DisputeReason Reason { get; set; }
        public string? Description { get; set; }
        public DisputeStatus Status { get; set; }
        public DisputeResolution? Resolution { get; set; }
        public decimal? RefundAmount { get; set; }
        public string? AdminNotes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }
}
