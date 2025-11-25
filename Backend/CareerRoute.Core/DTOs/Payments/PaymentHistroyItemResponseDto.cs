using CareerRoute.Core.Domain.Enums;
namespace CareerRoute.Core.DTOs.Payments
{
    public class PaymentHistroyItemResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public string MentorName { get; set; } = string.Empty;
        public string SessionTopic { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public PaymentProviderOptions PaymentProvider { get; set; }
        public PaymentStatusOptions Status { get; set; }
        public string TransactionId { get; set; } = string.Empty;
        public DateTime? PaidAt { get; set; }
        public decimal? RefundAmount { get; set; }
        public DateTime? RefundedAt { get; set; }
    }
}
