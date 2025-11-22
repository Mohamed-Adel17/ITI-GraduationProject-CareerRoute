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
        public SessionRepository (ApplicationDbContext dbContext) : base(dbContext)
        {
        }
        public async Task<bool> HasOverlappingSession(string menteeId, DateTime start, DateTime end)
        {
            return await dbContext.Sessions
                .AnyAsync(s =>
                    s.MenteeId == menteeId &&
                    s.Status != SessionStatusOptions.Cancelled &&      // ignore cancelled sessions
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
                .Include(s => s.Payment)
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


        public async Task<List<Session>> GetUpcomingSessionsAsync(string userId, string userRole)
        {
            var now = DateTime.UtcNow;

            var query = dbContext.Sessions.AsQueryable();

            // Filter by user role
            if (userRole == "User")
                query = query.Where(s => s.MenteeId == userId);
            else if (userRole == "Mentor")
                query = query.Where(s => s.MentorId == userId);
            // Admin can see all, no filter

            // Filter by status and future sessions
            query = query.Where(s => (s.Status == SessionStatusOptions.Confirmed
                                      || s.Status == SessionStatusOptions.Pending)
                                      && s.ScheduledStartTime >= now);

            // Order by start time
            query = query.OrderBy(s => s.ScheduledStartTime);

            return await query.ToListAsync();
        }


        public async Task<List<Session>> GetPastSessionsAsync(string userId, string userRole)
        {
            var now = DateTime.UtcNow;

            var query = dbContext.Sessions.AsQueryable();

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

            return await query.ToListAsync();
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




    }
}
