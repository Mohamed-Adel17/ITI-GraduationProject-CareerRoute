namespace CareerRoute.Core.DTOs.TimeSlots
{
    /// <summary>
    /// Query parameters DTO for mentor's slots list
    /// </summary>
    public class GetMentorSlotsQueryDto
    {
        public DateTime? StartDate { get; set; }
        
        public DateTime? EndDate { get; set; }
        
        public bool? IsBooked { get; set; }
        
        public int Page { get; set; } = 1;
        
        public int PageSize { get; set; } = 20;
    }
}
