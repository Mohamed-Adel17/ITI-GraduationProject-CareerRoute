using CareerRoute.Core.Domain.Enums;


namespace CareerRoute.Core.DTOs.Payments
{
    public class PaymentIntentRequestDto
    {
        public string SessionId { get; set; } = string.Empty;

        public PaymentProviderOptions PaymentProvider { get; set; }
        public PaymobPaymentMethodOptions? PaymobPaymentMethod { get; set; }
    }
}
