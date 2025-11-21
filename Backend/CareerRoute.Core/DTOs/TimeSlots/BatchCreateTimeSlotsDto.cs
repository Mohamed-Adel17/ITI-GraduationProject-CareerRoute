using System.ComponentModel.DataAnnotations;

namespace CareerRoute.Core.DTOs.TimeSlots
{
    /// <summary>
    /// Input DTO for batch creating multiple time slots (max 50)
    /// </summary>
    public class BatchCreateTimeSlotsDto
    {
        [Required(ErrorMessage = "Slots array is required")]
        [MinLength(1, ErrorMessage = "At least one slot is required")]
        [MaxLength(50, ErrorMessage = "Cannot create more than 50 slots in one request")]
        public List<CreateTimeSlotDto> Slots { get; set; } = new();
    }
}
