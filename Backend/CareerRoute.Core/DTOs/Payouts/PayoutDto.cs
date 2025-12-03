using CareerRoute.Core.Domain.Enums;

namespace CareerRoute.Core.DTOs.Payouts
{
    public class PayoutDto
    {
        public string Id { get; set; } = string.Empty;
        public string MentorId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public PayoutStatus Status { get; set; }
        public string? FailureReason { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}
