using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Sessions;

namespace CareerRoute.Core.DTOs.Payments
{
    public class PaymentConfirmResponseDto
    {
        public string PaymentId { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal PlatformCommission { get; set; }
        public decimal MentorPayoutAmount { get; set; }
        public PaymentProviderOptions PaymentProvider { get; set; }
        public PaymentStatusOptions Status { get; set; }
        public string TransactionId { get; set; } = string.Empty;
        public DateTime PaidAt { get; set; }
        public SessionPaymentResponseDto Session { get; set; } = new();
    }
}
