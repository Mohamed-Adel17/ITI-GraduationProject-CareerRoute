namespace CareerRoute.Core.External.Payment
{
    public class PaymentRefundResponse
    {
        public bool Success { get; set; }
        public string? TransactionId { get; set; }
        public string? ErrorMessage { get; set; }
        public decimal RefundedAmount { get; set; }
        public string Currency { get; set; } = string.Empty;
    }
}
