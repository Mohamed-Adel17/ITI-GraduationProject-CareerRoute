using Newtonsoft.Json;

namespace CareerRoute.Core.DTOs.Zoom;

public class ZoomWebhookObject
{
    [JsonProperty("id")]
    public long Id { get; set; }  // Meeting ID
    
    [JsonProperty("uuid")]
    public string Uuid { get; set; } = string.Empty;
    
    [JsonProperty("host_id")]
    public string HostId { get; set; } = string.Empty;
    
    [JsonProperty("topic")]
    public string Topic { get; set; } = string.Empty;
    
    [JsonProperty("start_time")]
    public DateTime StartTime { get; set; }
    
    [JsonProperty("duration")]
    public int Duration { get; set; }
    
    [JsonProperty("download_access_token")]
    public string? DownloadAccessToken { get; set; }    
    [JsonProperty("recording_files")]
    public List<ZoomRecordingFileDto> RecordingFiles { get; set; } = new();
}
