using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.DTOs.TimeSlots;

namespace CareerRoute.Core.Domain.Interfaces
{
    public interface ITimeSlotRepository : IBaseRepository<TimeSlot>
    {
        /// <summary>
        /// Get available slots for a mentor with optional filters
        /// </summary>
        Task<IEnumerable<TimeSlot>> GetAvailableSlotsForMentorAsync(
            string mentorId,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int? durationMinutes = null);

        /// <summary>
        /// Get all mentor's slots with pagination and filters
        /// </summary>
        Task<IEnumerable<TimeSlot>> GetMentorSlotsAsync(
            string mentorId,
            DateTime? startDate = null,
            DateTime? endDate = null,
            bool? isBooked = null,
            int page = 1,
            int pageSize = 20);

        /// <summary>
        /// Get total count of mentor's slots for pagination
        /// </summary>
        Task<int> GetSlotCountForMentorAsync(
            string mentorId,
            DateTime? startDate = null,
            DateTime? endDate = null,
            bool? isBooked = null);

        /// <summary>
        /// Get slot by ID with mentor and session details
        /// </summary>
        Task<TimeSlot?> GetSlotByIdAsync(string slotId);

        /// <summary>
        /// Check if a slot already exists at the same time for a mentor
        /// </summary>
        Task<bool> CheckSlotExistsAsync(string mentorId, DateTime startDateTime);

        /// <summary>
        /// Check if the given time range overlaps with any existing slot for the mentor
        /// </summary>
        Task<bool> HasOverlapAsync(string mentorId, DateTime start, DateTime end);
    }
}
