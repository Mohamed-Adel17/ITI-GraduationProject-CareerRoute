using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
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
                .Include(s => s.Mentee)
                .Include(s => s.Mentor) // Include first-level Mentor entity
                .ThenInclude(m => m.User)   //  Include the User entity inside Mentor
                .Include(s => s.Payment)
                .FirstOrDefaultAsync(s => s.Id == sessionId);
        }




    }
}
