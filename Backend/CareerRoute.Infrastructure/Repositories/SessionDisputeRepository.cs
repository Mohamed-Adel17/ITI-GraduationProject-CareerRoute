using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.Disputes;
using CareerRoute.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CareerRoute.Infrastructure.Repositories
{
    public class SessionDisputeRepository : GenericRepository<SessionDispute>, ISessionDisputeRepository
    {
        public SessionDisputeRepository(ApplicationDbContext dbContext) : base(dbContext) { }

        public async Task<SessionDispute?> GetBySessionIdAsync(string sessionId)
        {
            return await dbContext.SessionDisputes
                .FirstOrDefaultAsync(d => d.SessionId == sessionId);
        }

        public async Task<SessionDispute?> GetByIdWithDetailsAsync(string disputeId)
        {
            return await dbContext.SessionDisputes
                .Include(d => d.Session)
                    .ThenInclude(s => s.Mentor)
                        .ThenInclude(m => m.User)
                .Include(d => d.Mentee)
                .FirstOrDefaultAsync(d => d.Id == disputeId);
        }

        public async Task<bool> HasActiveDisputeAsync(string sessionId)
        {
            return await dbContext.SessionDisputes
                .AnyAsync(d => d.SessionId == sessionId && d.Status == DisputeStatus.Pending);
        }

        public async Task<(IEnumerable<SessionDispute> Disputes, int TotalCount)> GetFilteredDisputesAsync(AdminDisputeFilterDto filter)
        {
            var query = dbContext.SessionDisputes
                .Include(d => d.Session)
                    .ThenInclude(s => s.Mentor)
                        .ThenInclude(m => m.User)
                .Include(d => d.Mentee)
                .AsQueryable();

            if (filter.Status.HasValue)
                query = query.Where(d => d.Status == filter.Status.Value);

            if (filter.Reason.HasValue)
                query = query.Where(d => d.Reason == filter.Reason.Value);

            if (!string.IsNullOrWhiteSpace(filter.MenteeId))
                query = query.Where(d => d.MenteeId == filter.MenteeId);

            if (!string.IsNullOrWhiteSpace(filter.MentorId))
                query = query.Where(d => d.Session.MentorId == filter.MentorId);

            if (filter.StartDate.HasValue)
                query = query.Where(d => d.CreatedAt >= filter.StartDate.Value);

            if (filter.EndDate.HasValue)
                query = query.Where(d => d.CreatedAt < filter.EndDate.Value.Date.AddDays(1));

            var totalCount = await query.CountAsync();

            query = filter.SortBy?.ToLower() switch
            {
                "status" => filter.SortDescending ? query.OrderByDescending(d => d.Status) : query.OrderBy(d => d.Status),
                "reason" => filter.SortDescending ? query.OrderByDescending(d => d.Reason) : query.OrderBy(d => d.Reason),
                _ => filter.SortDescending ? query.OrderByDescending(d => d.CreatedAt) : query.OrderBy(d => d.CreatedAt)
            };

            var disputes = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return (disputes, totalCount);
        }
    }
}
