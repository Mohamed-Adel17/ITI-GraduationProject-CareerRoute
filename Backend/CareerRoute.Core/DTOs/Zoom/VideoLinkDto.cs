namespace CareerRoute.Core.DTOs.Zoom
{
    /// <summary>
    /// DTO for video conference link access
    /// </summary>
    public class VideoLinkDto
    {
        public string JoinUrl { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public DateTime ScheduledStartTime { get; set; }
        public DateTime ScheduledEndTime { get; set; }
        // Zoom branch compatibility
        public DateTime? AvailableFrom { get; set; }
        public DateTime? AvailableUntil { get; set; }
    }
}
