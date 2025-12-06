using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CareerRoute.Infrastructure.Repositories
{
    public class PreviousWorkRepository : GenericRepository<PreviousWork>, IPreviousWorkRepository
    {
        public PreviousWorkRepository(ApplicationDbContext dbContext) : base(dbContext) { }

        public async Task<PreviousWork?> GetByIdAsync(int id)
        {
            return await dbContext.PreviousWorks.FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<IEnumerable<PreviousWork>> GetByMentorIdAsync(string mentorId)
        {
            return await dbContext.PreviousWorks
                .Where(p => p.MentorId == mentorId)
                .OrderByDescending(p => p.StartDate)
                .ToListAsync();
        }
    }
}
