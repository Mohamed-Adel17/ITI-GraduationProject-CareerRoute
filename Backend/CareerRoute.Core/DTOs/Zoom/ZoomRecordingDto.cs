namespace CareerRoute.Core.DTOs.Zoom;

public class ZoomRecordingDto
{
    public long MeetingId { get; set; }
    public string Topic { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public int Duration { get; set; }
    public List<ZoomRecordingFileDto> RecordingFiles { get; set; } = new();
    public long TotalSize { get; set; }
}
