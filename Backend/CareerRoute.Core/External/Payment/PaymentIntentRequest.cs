using CareerRoute.Core.Domain.Enums;

namespace CareerRoute.Core.External.Payment
{
    public class PaymentIntentRequest
    {
        public string SessionId { get; set; } = null!;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = null!;  // e.g., "USD", "EGP"
        public PaymobPaymentMethod? PaymentMethod { get; set; }
        public string? MenteeEmail { get; set; } 
        public string? MenteeFirstName { get; set; }
        public string? MenteeLastName { get; set; }
        public string? MenteePhone { get; set; }

        

    }

}
