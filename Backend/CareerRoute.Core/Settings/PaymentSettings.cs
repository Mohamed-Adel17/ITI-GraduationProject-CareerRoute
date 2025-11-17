
namespace CareerRoute.Core.Settings
{
    public class PaymentSettings
    {
        public Stripe Stripe { get; set; } = new Stripe();
        public Paymob Paymob { get; set; } = new Paymob();
    }

    public class Stripe
    {
        public string Provider { get; set; } = "Stripe";
        public string PublishableKey { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;
        public string WebhookSecret { get; set; } = string.Empty;
    }




    public class Paymob
    {
        public string Provider { get; set; } = "Paymob";
        public string ApiKey { get; set; } = string.Empty;
        public string HmacSecret { get; set; } = string.Empty;
        public string IntegrationId { get; set; } = string.Empty;
        public string WalletIntegrationId { get; set; } = string.Empty;
    }

}
