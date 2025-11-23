namespace CareerRoute.Core.DTOs.TimeSlots
{
    /// <summary>
    /// Query parameters DTO for filtering available slots
    /// </summary>
    public class GetAvailableSlotsQueryDto
    {
        public DateTime? StartDate { get; set; }
        
        public DateTime? EndDate { get; set; }
        
        public int? DurationMinutes { get; set; }
    }
}
