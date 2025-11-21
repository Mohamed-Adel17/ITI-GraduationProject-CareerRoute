namespace CareerRoute.Core.DTOs.TimeSlots
{
    /// <summary>
    /// Response wrapper for available slots including mentor info and date range
    /// </summary>
    public class AvailableSlotsResponseDto
    {
        public string MentorId { get; set; } = string.Empty;
        
        public string MentorName { get; set; } = string.Empty;
        
        public List<AvailableSlotDto> AvailableSlots { get; set; } = new();
        
        public int TotalCount { get; set; }
        
        public DateRangeDto DateRange { get; set; } = new();
    }
    
    public class DateRangeDto
    {
        public string StartDate { get; set; } = string.Empty;
        
        public string EndDate { get; set; } = string.Empty;
    }
}
