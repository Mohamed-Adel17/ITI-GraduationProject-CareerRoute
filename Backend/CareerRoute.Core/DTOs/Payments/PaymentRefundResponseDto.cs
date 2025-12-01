using CareerRoute.Core.Domain.Enums;

namespace CareerRoute.Core.DTOs.Payments
{
    public class PaymentRefundResponseDto
    {
        public string PaymentId { get; set; } = string.Empty;
        public decimal RefundAmount { get; set; }
        public decimal RefundPercentage { get; set; }
        public PaymentStatusOptions Status { get; set; }
        public DateTime RefundedAt { get; set; }
    }
}
