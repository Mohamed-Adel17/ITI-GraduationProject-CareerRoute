namespace CareerRoute.Core.DTOs.TimeSlots
{
    /// <summary>
    /// Nested DTO for session details when viewing booked slots
    /// </summary>
    public class SessionPreviewDto
    {
        public string Id { get; set; } = string.Empty;
        
        public string MenteeFirstName { get; set; } = string.Empty;
        
        public string MenteeLastName { get; set; } = string.Empty;
        
        public string Status { get; set; } = string.Empty;
        
        public string? Topic { get; set; }
    }
}
