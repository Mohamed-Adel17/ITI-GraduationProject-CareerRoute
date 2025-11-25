namespace CareerRoute.Core.DTOs.Zoom;

public class CreateZoomMeetingRequest
{
    public string Topic { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public int DurationMinutes { get; set; }
    public string Timezone { get; set; } = "UTC";
}
