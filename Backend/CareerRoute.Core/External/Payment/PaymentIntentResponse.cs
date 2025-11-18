using CareerRoute.Core.Domain.Enums;

namespace CareerRoute.Core.External.Payment
{
    public class PaymentIntentResponse
    {
        public bool Success { get; set; }
        public string PaymentIntentId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } =string.Empty;
        public PaymobPaymentMethodOptions? PaymobPaymentMethod { get; set; }
        
        public string? ErrorMessage { get; set; }
    }
}
