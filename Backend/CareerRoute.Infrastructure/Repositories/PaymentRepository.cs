using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CareerRoute.Infrastructure.Repositories
{
    public class PaymentRepository : GenericRepository<Payment>, IPaymentRepository
    {
        public PaymentRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }

        public async Task<Payment?> GetByPaymentIntentIdAsync(string paymentIntentId)
        {
            return await dbContext.Payments.Include(p => p.Session).AsNoTracking()
                .FirstOrDefaultAsync(p => p.PaymentIntentId == paymentIntentId);
        }

        public async Task<int> GetPaymentHistoryCountAsync(string userId, PaymentStatusOptions? status = null)
        {

            var query = dbContext.Payments.Where(p => p.MenteeId == userId);

            if (status is not null)
                query = query.Where(p => p.Status == status);

            return await query.CountAsync();
        }

        public async Task<IEnumerable<Payment>> GetPaymentHistoryWithSessionAsync(string userId, int page = 1, int pageSize = 10, PaymentStatusOptions? status = null)
        {
            var query = dbContext.Payments.Where(p => p.MenteeId == userId);

            if (status is not null)
                query = query.Where(p => p.Status == status);

            return await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip(pageSize * (page - 1))
                .Take(pageSize)
                .Include(p => p.Session)
                .ToListAsync();
        }
    }
}
