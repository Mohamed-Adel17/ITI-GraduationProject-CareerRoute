using Newtonsoft.Json;

namespace CareerRoute.Core.DTOs.Zoom;

public class ZoomRecordingFileDto
{
    [JsonProperty("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonProperty("file_type")]
    public string FileType { get; set; } = string.Empty;  // MP4, M4A, TRANSCRIPT, etc.
    
    [JsonProperty("file_size")]
    public long FileSize { get; set; }
    
    [JsonProperty("play_url")]
    public string PlayUrl { get; set; } = string.Empty;
    
    [JsonProperty("download_url")]
    public string DownloadUrl { get; set; } = string.Empty;
    
    [JsonProperty("recording_start")]
    public DateTime RecordingStart { get; set; }
    
    [JsonProperty("recording_end")]
    public DateTime RecordingEnd { get; set; }
    
    [JsonProperty("status")]
    public string Status { get; set; } = string.Empty;
}
