using System.ComponentModel.DataAnnotations;

namespace CareerRoute.Core.DTOs.TimeSlots
{
    /// <summary>
    /// Input DTO for creating a single time slot
    /// </summary>
    public class CreateTimeSlotDto
    {
        [Required(ErrorMessage = "Start date and time is required")]
        public DateTime StartDateTime { get; set; }
        
        [Required(ErrorMessage = "Duration is required")]
        [Range(30, 60, ErrorMessage = "Duration must be 30 or 60 minutes")]
        public int DurationMinutes { get; set; }
    }
}
