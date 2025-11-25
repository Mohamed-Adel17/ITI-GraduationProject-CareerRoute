namespace CareerRoute.Core.DTOs.Zoom
{
    public class SessionRecordingDto
    {
        public string SessionId { get; set; } = string.Empty;
        public string RecordingPlayUrl { get; set; } = string.Empty;
        // Zoom branch uses PlayUrl; keep alias for compatibility
        public string PlayUrl { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;  // Time-limited JWT
        public DateTime ExpiresAt { get; set; }
        public bool IsAvailable { get; set; }
        public string Status { get; set; } = string.Empty;  // "Available", "Processing", "Failed"
        public DateTime? AvailableAt { get; set; }
        public string? Transcript { get; set; }
    }
}
