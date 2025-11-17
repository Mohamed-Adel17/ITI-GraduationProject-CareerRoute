using CareerRoute.Core.Domain.Enums;

namespace CareerRoute.Core.DTOs.Payments
{
    public class PaymentIntentResponseDto
    {
        public string PaymentIntentId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public PaymentProviderOptions PaymentProvider { get; set; }
        public PaymobPaymentMethodOptions? PaymobPaymentMethod { get; set; }
        public PaymentStatusOptions Status { get; set; }

    }
}
