

namespace CareerRoute.Core.DTOs.TimeSlots
{
    /// <summary>
    /// Input DTO for batch creating multiple time slots (max 50)
    /// </summary>
    public class BatchCreateTimeSlotsDto
    {
        public List<CreateTimeSlotDto> Slots { get; set; } = new();
    }
}
