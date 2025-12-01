
using System.Text.Json.Serialization;

namespace CareerRoute.Core.External.Payment
{
    public class PaymobAuthResponse
    {
        [JsonPropertyName("token")]
        public string Token { get; set; } = string.Empty;
    }
    public class PaymobOrderResponse
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }
    }
    public class PaymobPaymentKeyResponse
    {
        [JsonPropertyName("token")]
        public string Token { get; set; } = string.Empty;
    }
}
