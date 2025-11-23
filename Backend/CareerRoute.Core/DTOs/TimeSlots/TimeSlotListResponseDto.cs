namespace CareerRoute.Core.DTOs.TimeSlots
{
    /// <summary>
    /// Response DTO for mentor's time slots list with pagination and summary
    /// </summary>
    public class TimeSlotListResponseDto
    {
        public List<TimeSlotDto> TimeSlots { get; set; } = new();
        
        public PaginationMetadata Pagination { get; set; } = new();
        
        public SlotsSummary Summary { get; set; } = new();
    }
    
    public class PaginationMetadata
    {
        public int TotalCount { get; set; }
        
        public int CurrentPage { get; set; }
        
        public int PageSize { get; set; }
        
        public int TotalPages { get; set; }
        
        public bool HasNextPage { get; set; }
        
        public bool HasPreviousPage { get; set; }
    }
    
    public class SlotsSummary
    {
        public int TotalSlots { get; set; }
        
        public int AvailableSlots { get; set; }
        
        public int BookedSlots { get; set; }
    }
}
