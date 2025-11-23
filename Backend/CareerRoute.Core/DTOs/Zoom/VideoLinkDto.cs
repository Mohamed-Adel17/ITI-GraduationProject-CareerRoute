namespace CareerRoute.Core.DTOs.Zoom
{
    /// <summary>
    /// DTO for video conference link access
    /// </summary>
    public class VideoLinkDto
    {
        /// <summary>
        /// The Zoom meeting join URL
        /// </summary>
        public string JoinUrl { get; set; } = string.Empty;

        /// <summary>
        /// The meeting password
        /// </summary>
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// The session ID
        /// </summary>
        public string SessionId { get; set; } = string.Empty;

        /// <summary>
        /// The scheduled start time of the session
        /// </summary>
        public DateTime ScheduledStartTime { get; set; }

        /// <summary>
        /// The scheduled end time of the session
        /// </summary>
        public DateTime ScheduledEndTime { get; set; }
    }
}
