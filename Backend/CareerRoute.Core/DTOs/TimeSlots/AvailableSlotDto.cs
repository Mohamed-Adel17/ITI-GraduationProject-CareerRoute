namespace CareerRoute.Core.DTOs.TimeSlots
{
    /// <summary>
    /// Lightweight DTO for public available slots endpoint
    /// Includes only essential fields and price
    /// </summary>
    public class AvailableSlotDto
    {
        public string Id { get; set; } = string.Empty;
        
        public DateTime StartDateTime { get; set; }
        
        public DateTime EndDateTime { get; set; } // Calculated: StartDateTime + DurationMinutes
        
        public int DurationMinutes { get; set; }
        
        public decimal Price { get; set; } // Mentor's rate30Min or rate60Min
    }
}
