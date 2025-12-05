using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.Payouts;
using CareerRoute.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CareerRoute.Infrastructure.Repositories
{
    public class PayoutRepository : GenericRepository<Payout>, IPayoutRepository
    {
        public PayoutRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }

        public async Task<(IEnumerable<Payout> Payouts, int TotalCount)> GetPayoutHistoryWithCountAsync(string mentorId, int page, int pageSize)
        {
            var query = dbContext.Payouts.Where(p => p.MentorId == mentorId);

            var totalCount = await query.CountAsync();
            var payouts = await query
                .OrderByDescending(p => p.RequestedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (payouts, totalCount);
        }

        public async Task<Payout?> GetByIdWithMentorAsync(string payoutId)
        {
            return await dbContext.Payouts
                .Include(p => p.Mentor)
                .FirstOrDefaultAsync(p => p.Id == payoutId);
        }

        public async Task<IEnumerable<Payout>> GetByStatusAsync(PayoutStatus status)
        {
            return await dbContext.Payouts
                .Where(p => p.Status == status)
                .OrderBy(p => p.RequestedAt)
                .ToListAsync();
        }

        public async Task<(IEnumerable<Payout> Payouts, int TotalCount)> GetFilteredPayoutsAsync(AdminPayoutFilterDto filter)
        {
            var query = dbContext.Payouts
                .Include(p => p.Mentor)
                .ThenInclude(m => m.User)
                .AsQueryable();

            // Filter by mentor ID
            if (!string.IsNullOrWhiteSpace(filter.MentorId))
            {
                query = query.Where(p => p.MentorId == filter.MentorId);
            }

            // Filter by mentor name
            if (!string.IsNullOrWhiteSpace(filter.MentorName))
            {
                var searchTerm = filter.MentorName.ToLower();
                query = query.Where(p =>
                    p.Mentor.User.FirstName.ToLower().Contains(searchTerm) ||
                    p.Mentor.User.LastName.ToLower().Contains(searchTerm) ||
                    (p.Mentor.User.FirstName + " " + p.Mentor.User.LastName).ToLower().Contains(searchTerm));
            }

            // Filter by status
            if (filter.Status.HasValue)
            {
                query = query.Where(p => p.Status == filter.Status.Value);
            }

            // Filter by amount range
            if (filter.MinAmount.HasValue)
            {
                query = query.Where(p => p.Amount >= filter.MinAmount.Value);
            }

            if (filter.MaxAmount.HasValue)
            {
                query = query.Where(p => p.Amount <= filter.MaxAmount.Value);
            }

            // Filter by date range
            if (filter.StartDate.HasValue)
            {
                query = query.Where(p => p.RequestedAt >= filter.StartDate.Value);
            }

            if (filter.EndDate.HasValue)
            {
                var endDate = filter.EndDate.Value.Date.AddDays(1);
                query = query.Where(p => p.RequestedAt < endDate);
            }

            // Get total count before pagination
            var totalCount = await query.CountAsync();

            // Apply sorting
            query = filter.SortBy?.ToLower() switch
            {
                "amount" => filter.SortDescending
                    ? query.OrderByDescending(p => p.Amount)
                    : query.OrderBy(p => p.Amount),
                "status" => filter.SortDescending
                    ? query.OrderByDescending(p => p.Status)
                    : query.OrderBy(p => p.Status),
                "mentor" => filter.SortDescending
                    ? query.OrderByDescending(p => p.Mentor.User.FirstName).ThenByDescending(p => p.Mentor.User.LastName)
                    : query.OrderBy(p => p.Mentor.User.FirstName).ThenBy(p => p.Mentor.User.LastName),
                _ => filter.SortDescending
                    ? query.OrderByDescending(p => p.RequestedAt)
                    : query.OrderBy(p => p.RequestedAt)
            };

            // Apply pagination
            var payouts = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return (payouts, totalCount);
        }
    }
}
