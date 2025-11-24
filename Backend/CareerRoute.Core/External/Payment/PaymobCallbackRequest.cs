using System.Text.Json.Serialization;
namespace CareerRoute.Core.External.Payment
{
    public class PaymobCallbackRequest
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("obj")]
        public PaymobTransaction? Obj { get; set; }
    }

    public class PaymobTransaction
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("pending")]
        public bool Pending { get; set; }

        [JsonPropertyName("amount_cents")]
        public int Amount_Cents { get; set; }

        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("is_auth")]
        public bool Is_Auth { get; set; }

        [JsonPropertyName("is_capture")]
        public bool Is_Capture { get; set; }

        [JsonPropertyName("is_standalone_payment")]
        public bool Is_Standalone_Payment { get; set; }

        [JsonPropertyName("is_voided")]
        public bool Is_Voided { get; set; }

        [JsonPropertyName("is_refunded")]
        public bool Is_Refunded { get; set; }

        [JsonPropertyName("is_3d_secure")]
        public bool Is_3d_Secure { get; set; }

        [JsonPropertyName("integration_id")]
        public int Integration_Id { get; set; }

        [JsonPropertyName("has_parent_transaction")]
        public bool Has_Parent_Transaction { get; set; }

        [JsonPropertyName("order")]
        public PaymobOrder? Order { get; set; }

        [JsonPropertyName("created_at")]
        public string Created_At { get; set; } = string.Empty;

        [JsonPropertyName("currency")]
        public string Currency { get; set; } = string.Empty;

        [JsonPropertyName("source_data")]
        public PaymobSourceData? Source_Data { get; set; }

        [JsonPropertyName("error_occured")]
        public bool Error_Occured { get; set; }

        [JsonPropertyName("owner")]
        public int Owner { get; set; }

        [JsonPropertyName("data")]
        public PaymobData? Data { get; set; }

        [JsonPropertyName("hmac")]
        public string Hmac { get; set; } = string.Empty;

    }

    public class PaymobOrder
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }
    }

    public class PaymobSourceData
    {
        [JsonPropertyName("pan")]
        public string Pan { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("sub_type")]
        public string Sub_Type { get; set; } = string.Empty;
    }

    public class PaymobData
    {
        [JsonPropertyName("hmac")]
        public string Hmac { get; set; } = string.Empty;
    }
}
