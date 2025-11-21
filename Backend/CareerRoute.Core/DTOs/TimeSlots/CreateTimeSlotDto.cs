using System.ComponentModel.DataAnnotations;

namespace CareerRoute.Core.DTOs.TimeSlots
{
    /// <summary>
    /// Input DTO for creating a single time slot
    /// </summary>
    public class CreateTimeSlotDto
    {
        public DateTime StartDateTime { get; set; }
        
        public int DurationMinutes { get; set; }
    }
}
