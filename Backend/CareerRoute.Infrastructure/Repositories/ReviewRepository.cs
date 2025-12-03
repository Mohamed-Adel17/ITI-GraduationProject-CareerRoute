using CareerRoute.Core.Domain.Entities ;
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

    public class ReviewRepository : GenericRepository<ReviewSession>, IReviewRepository
    {
        public ReviewRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }

        

        public async Task<decimal> GetMentorAverageRatingAsync(string mentorId)
        {
            var average = await dbContext.Set<ReviewSession>()
                .Where(r => r.Session.MentorId == mentorId)
                .AverageAsync(r => (decimal?)r.Rating);
            return Math.Round(average ?? 0, 2);
        }

        public async Task<ReviewSession?> GetByIdWithRelationsAsync(string reviewId)
        {

            return await dbContext.ReviewSessions

                .Include(r => r.Session)
                    .ThenInclude(s => s.Mentor)
                        .ThenInclude(m => m.User)
                .Include(r => r.Session)
                    .ThenInclude(s => s.Mentee)
                .FirstOrDefaultAsync(r => r.Id == reviewId);
        }


        public async Task<(List<ReviewSession> Items, int TotalCount)> GetReviewsForMentorAsync(string mentorId, int page, int pageSize)
        {
            var query = dbContext.ReviewSessions
                .Include(r => r.Session)
                    .ThenInclude(s => s.Mentor)
                        .ThenInclude(m => m.User)
                .Where(r => r.Session.MentorId == mentorId)
                .AsQueryable();


            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

    }
}
