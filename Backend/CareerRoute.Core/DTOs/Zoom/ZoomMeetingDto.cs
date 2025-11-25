namespace CareerRoute.Core.DTOs.Zoom;

public class ZoomMeetingDto
{
    public long Id { get; set; }
    public string Uuid { get; set; } = string.Empty;
    public string Topic { get; set; } = string.Empty;
    public string JoinUrl { get; set; } = string.Empty;
    public string StartUrl { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public int Duration { get; set; }
    public string Status { get; set; } = string.Empty;
}
