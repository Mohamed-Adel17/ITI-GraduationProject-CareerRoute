using CareerRoute.Core.Domain.Enums;


namespace CareerRoute.Core.DTOs.Payments
{
    public class PaymentIntentRequestDto
    {
        public string SessionId { get; set; } = string.Empty;

        public PaymentMethodOptions PaymentMethod { get; set; }
        public PaymobPaymentMethod PaymobPaymentMethod { get; set; }
    }
}
