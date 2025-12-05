using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CareerRoute.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation for MentorBalance entity
    /// </summary>
    public class MentorBalanceRepository : GenericRepository<MentorBalance>, IMentorBalanceRepository
    {
        public MentorBalanceRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }

        public async Task<MentorBalance?> GetByMentorIdAsync(string mentorId)
        {
            return await dbContext.MentorBalances
                .FirstOrDefaultAsync(mb => mb.MentorId == mentorId);
        }
    }
}
