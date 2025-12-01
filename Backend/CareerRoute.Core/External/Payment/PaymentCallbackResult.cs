using CareerRoute.Core.Domain.Enums;

namespace CareerRoute.Core.External.Payment
{
    public class PaymentCallbackResult
    {
        public bool Success { get; set; }
        public string OrderId { get; set; }
        public string PaymentIntentId { get; set; }
        public string TransactionId { get; set; }
        public PaymentStatusOptions Status { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; }
        public string ErrorMessage { get; set; }
        public Dictionary<string, object> RawData { get; set; }
    }
}
