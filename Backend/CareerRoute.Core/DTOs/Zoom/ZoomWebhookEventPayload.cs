using Newtonsoft.Json;

namespace CareerRoute.Core.DTOs.Zoom;

public class ZoomWebhookEventPayload
{
    [JsonProperty("object")]
    public ZoomWebhookObject Object { get; set; } = new();

    [JsonProperty("plainToken")]
    public string? PlainToken { get; set; }
}
