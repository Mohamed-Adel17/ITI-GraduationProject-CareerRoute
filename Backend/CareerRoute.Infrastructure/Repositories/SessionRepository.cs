using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.Sessions;
using CareerRoute.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using SendGrid.Helpers.Mail;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Infrastructure.Repositories
{
    public class SessionRepository : GenericRepository<Session>, ISessionRepository
    {
        public SessionRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }
        public async Task<bool> HasOverlappingSession(string menteeId, DateTime start, DateTime end)
        {
            return await dbContext.Sessions
                .AnyAsync(s =>
                    s.MenteeId == menteeId &&
                    s.Status != SessionStatusOptions.Cancelled &&      // ignore cancelled sessions
                    s.Status != SessionStatusOptions.NoShow &&      // ignore noShow sessions
                    s.ScheduledStartTime < end &&                      // existing.start < new.end
                    s.ScheduledEndTime > start                         // existing.end > new.start
                );
        }
        public async Task<Session?> GetByIdWithRelationsAsync(string sessionId)
        {
            return await dbContext.Sessions
                .Include(s => s.Payment)
                .Include(s => s.Mentee)
                .Include(s => s.Mentor) // Include first-level Mentor entity
                .ThenInclude(m => m.User)   //  Include the User entity inside Mentor
                .Include(s => s.Reschedule)
                .Include(s=>s.Review)
                .FirstOrDefaultAsync(s => s.Id == sessionId);
        }
        public async Task<List<Session>> GetSessionsStartingBetweenAsync(DateTime start, DateTime end) //For Background job 
        {
            return await dbContext.Sessions
                .Where(s => s.Status == SessionStatusOptions.Confirmed
                            && s.ScheduledStartTime > start
                            && s.ScheduledStartTime <= end)
                .ToListAsync();
        }


        public async Task<(List<Session> Items, int TotalCount)> GetUpcomingSessionsAsync(string userId, string userRole, int page, int pageSize)
        {
            var now = DateTime.UtcNow;

            var query = dbContext.Sessions
                .Include(s => s.Mentee)
                .Include(s => s.Mentor)
                .ThenInclude(m => m.User)
                .AsQueryable();

            // Filter by user role
            if (userRole == "User")
                query = query.Where(s => s.MenteeId == userId);
            else if (userRole == "Mentor")
                query = query.Where(s => s.MentorId == userId);
            // Admin can see all, no filter

            // Filter by status and future sessions
            query = query.Where(s => 
                s.Status == SessionStatusOptions.InProgress ||
                ((s.Status == SessionStatusOptions.Confirmed
                  || s.Status == SessionStatusOptions.Pending
                  || s.Status == SessionStatusOptions.PendingReschedule)
                  && s.ScheduledStartTime >= now));

            // Order by start time
            query = query.OrderBy(s => s.ScheduledStartTime);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }


        public async Task<(List<Session> Items, int TotalCount)> GetPastSessionsAsync(string userId, string userRole, int page, int pageSize)
        {
            var now = DateTime.UtcNow;

            var query = dbContext.Sessions
                .Include(s => s.Mentee)
                .Include(s => s.Mentor)
                .ThenInclude(m => m.User)
                .Include(s => s.Review)
                .AsQueryable();

            // Filter by user role
            if (userRole == "User")
                query = query.Where(s => s.MenteeId == userId);
            else if (userRole == "Mentor")
                query = query.Where(s => s.MentorId == userId);
            // Admin can see all sessions

            // Filter by past status: Completed or Cancelled
            query = query.Where(s => s.Status == SessionStatusOptions.Completed
                                     || s.Status == SessionStatusOptions.Cancelled);


            query = query.OrderByDescending(s => s.ScheduledStartTime);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }




        public async Task<bool> IsMenteeAvailableAsync(string menteeId, DateTime newStart, int durationMinutes)
        {
            // Logic:
            // 1. No active session exists for this mentee ( Excluding Cancelled and NoShow sessions)
            // 2. Overlap check applied on start + end time


            var newEnd = newStart.AddMinutes(durationMinutes);

            bool hasConflict = await dbContext.Sessions.AnyAsync(s =>
                s.MenteeId == menteeId &&
                s.Status != SessionStatusOptions.Cancelled &&
                s.Status != SessionStatusOptions.NoShow &&
                (
                    s.ScheduledStartTime < newEnd &&
                    newStart < s.ScheduledEndTime
                )
            );

            // Mentee is available when there is NO conflict
            return !hasConflict;
        }

        public async Task<Session?> GetByIdForPreparationAsync(string sessionId)
        {
            return await dbContext.Sessions
                .Include(s => s.Mentee)
                    .ThenInclude(m => m.UserSkills)
                        .ThenInclude(us => us.Skill)
                .Include(s => s.Mentor)
                    .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(s => s.Id == sessionId);
        }
    }
}
