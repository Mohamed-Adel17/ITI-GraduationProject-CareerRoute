using CareerRoute.Core.Domain.Enums;

namespace CareerRoute.Core.DTOs.Disputes
{
    public class AdminDisputeDto
    {
        public string Id { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public string MenteeId { get; set; } = string.Empty;
        public string MenteeFirstName { get; set; } = string.Empty;
        public string MenteeLastName { get; set; } = string.Empty;
        public string MenteeEmail { get; set; } = string.Empty;
        public string MentorId { get; set; } = string.Empty;
        public string MentorFirstName { get; set; } = string.Empty;
        public string MentorLastName { get; set; } = string.Empty;
        public decimal SessionPrice { get; set; }
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
