namespace CareerRoute.Core.DTOs.TimeSlots
{
    /// <summary>
    /// Complete DTO for TimeSlot with all properties
    /// Used for mentor's slot management views
    /// </summary>
    public class TimeSlotDto
    {
        public string Id { get; set; } = string.Empty;
        
        public string MentorId { get; set; } = string.Empty;
        
        public DateTime StartDateTime { get; set; }
        
        public DateTime EndDateTime { get; set; } // Calculated: StartDateTime + DurationMinutes
        
        public int DurationMinutes { get; set; }
        
        public bool IsBooked { get; set; }
        
        public string? SessionId { get; set; }
        
        public SessionPreviewDto? Session { get; set; } // Only included for booked slots
        
        public DateTime CreatedAt { get; set; }
        
        public bool? CanDelete { get; set; } // Only for mentor view: true if not booked
    }
}
