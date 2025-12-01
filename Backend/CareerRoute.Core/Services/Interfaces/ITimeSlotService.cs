using CareerRoute.Core.DTOs.TimeSlots;

namespace CareerRoute.Core.Services.Interfaces
{
    public interface ITimeSlotService
    {
        /// <summary>
        /// Get available slots for a mentor (public endpoint)
        /// </summary>
        Task<AvailableSlotsResponseDto> GetAvailableSlotsAsync(
            string mentorId,
            GetAvailableSlotsQueryDto query);

        /// <summary>
        /// Create a single time slot for a mentor
        /// </summary>
        Task<TimeSlotDto> CreateTimeSlotAsync(
            string mentorId,
            string currentUserId,
            CreateTimeSlotDto createDto);

        /// <summary>
        /// Create multiple time slots for a mentor (batch operation)
        /// </summary>
        Task<List<TimeSlotDto>> CreateTimeSlotsAsync(
            string mentorId,
            string currentUserId,
            BatchCreateTimeSlotsDto batchDto);

        /// <summary>
        /// Get all time slots for a mentor with pagination
        /// </summary>
        Task<TimeSlotListResponseDto> GetMentorTimeSlotsAsync(
            string mentorId,
            string currentUserId,
            GetMentorSlotsQueryDto query);

        /// <summary>
        /// Delete a time slot
        /// </summary>
        Task DeleteTimeSlotAsync(
            string mentorId,
            string slotId,
            string currentUserId);
    }
}
