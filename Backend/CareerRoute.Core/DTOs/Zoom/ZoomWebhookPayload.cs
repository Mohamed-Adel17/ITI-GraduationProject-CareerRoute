using Newtonsoft.Json;

namespace CareerRoute.Core.DTOs.Zoom;

public class ZoomWebhookPayload
{
    [JsonProperty("event")]
    public string Event { get; set; } = string.Empty;  // "recording.completed", "meeting.ended"
    
    [JsonProperty("payload")]
    public ZoomWebhookEventPayload Payload { get; set; } = new();
}
