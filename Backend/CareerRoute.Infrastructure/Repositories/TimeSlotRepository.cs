using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CareerRoute.Infrastructure.Repositories
{
    public class TimeSlotRepository : GenericRepository<TimeSlot>, ITimeSlotRepository
    {
        public TimeSlotRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }

        public async Task<IEnumerable<TimeSlot>> GetAvailableSlotsForMentorAsync(
            string mentorId,
            DateTime? startDate = null,
            DateTime? endDate = null,
            int? durationMinutes = null)
        {
            // Minimum bookable time: 24 hours from now
            var minimumDateTime = DateTime.UtcNow.AddHours(24);

            // Default start: 24 hours from now (respects the 24-hour advance booking rule)
            var start = startDate ?? minimumDateTime;
            
            // Default end: 90 days from start (or no limit if not specified)
            // If user provides startDate but no endDate, use 90 days from start
            // If user provides neither, use 90 days from minimumDateTime
            var end = endDate ?? start.AddDays(90);

            var query = dbContext.TimeSlots
                .Include(ts => ts.Mentor)
                .Where(ts => ts.MentorId == mentorId)
                .Where(ts => !ts.IsBooked)
                .Where(ts => ts.StartDateTime >= start && ts.StartDateTime <= end)
                .Where(ts => ts.StartDateTime > minimumDateTime); // Always enforce 24-hour rule

            // Filter by duration if specified
            if (durationMinutes.HasValue)
            {
                query = query.Where(ts => ts.DurationMinutes == durationMinutes.Value);
            }

            return await query
                .OrderBy(ts => ts.StartDateTime)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<TimeSlot>> GetMentorSlotsAsync(
            string mentorId,
            DateTime? startDate = null,
            DateTime? endDate = null,
            bool? isBooked = null,
            int page = 1,
            int pageSize = 20)
        {
            // Default date range: today to 30 days from today
            var start = startDate ?? DateTime.UtcNow.Date;
            var end = endDate ?? start.AddDays(30);

            var query = dbContext.TimeSlots
                .Include(ts => ts.Session)
                    .ThenInclude(s => s.Mentee)
                .Where(ts => ts.MentorId == mentorId)
                .Where(ts => ts.StartDateTime >= start && ts.StartDateTime <= end);

            // Filter by booking status if specified
            if (isBooked.HasValue)
            {
                query = query.Where(ts => ts.IsBooked == isBooked.Value);
            }

            return await query
                .OrderBy(ts => ts.StartDateTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<int> GetSlotCountForMentorAsync(
            string mentorId,
            DateTime? startDate = null,
            DateTime? endDate = null,
            bool? isBooked = null)
        {
            // Default date range: today to 30 days from today
            var start = startDate ?? DateTime.UtcNow.Date;
            var end = endDate ?? start.AddDays(30);

            var query = dbContext.TimeSlots
                .Where(ts => ts.MentorId == mentorId)
                .Where(ts => ts.StartDateTime >= start && ts.StartDateTime <= end);

            // Filter by booking status if specified
            if (isBooked.HasValue)
            {
                query = query.Where(ts => ts.IsBooked == isBooked.Value);
            }

            return await query.CountAsync();
        }

        public async Task<TimeSlot?> GetSlotByIdAsync(string slotId)
        {
            return await dbContext.TimeSlots
                .Include(ts => ts.Mentor)
                .Include(ts => ts.Session)
                    .ThenInclude(s => s.Mentee)
                .FirstOrDefaultAsync(ts => ts.Id == slotId);
        }

        public async Task<bool> CheckSlotExistsAsync(string mentorId, DateTime startDateTime)
        {
            return await dbContext.TimeSlots
                .AnyAsync(ts => ts.MentorId == mentorId && ts.StartDateTime == startDateTime);
        }

        public async Task<bool> HasOverlapAsync(string mentorId, DateTime start, DateTime end)
        {
            return await dbContext.TimeSlots
                .AnyAsync(ts => ts.MentorId == mentorId && 
                                ts.StartDateTime < end && 
                                start < ts.StartDateTime.AddMinutes(ts.DurationMinutes));
        }
    }
}
