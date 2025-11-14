using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CareerRoute.Infrastructure.Repositories
{
    public class SkillRepository : GenericRepository<Skill>, ISkillRepository
    {
        public SkillRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }

        public async Task<Skill?> GetByIdAsync(int id)
        {
            return await dbContext.Skills.FindAsync(id);
        }

        public async Task<Skill?> GetByIdWithCategoryAsync(int id)
        {
            return await dbContext.Skills
                .Include(s => s.Category)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<IEnumerable<Skill>> GetAllActiveAsync()
        {
            return await dbContext.Skills
                .Where(s => s.IsActive)
                .Include(s => s.Category)
                .OrderBy(s => s.Category.Name)
                .ThenBy(s => s.Name)
                .ToListAsync();
        }

        public async Task<IEnumerable<Skill>> GetByCategoryIdAsync(int categoryId, bool activeOnly = true)
        {
            var query = dbContext.Skills
                .Include(s => s.Category)
                .Where(s => s.CategoryId == categoryId);

            if (activeOnly)
            {
                query = query.Where(s => s.IsActive);
            }

            return await query
                .OrderBy(s => s.Name)
                .ToListAsync();
        }

        public async Task<bool> ExistsAsync(string name, int categoryId)
        {
            return await dbContext.Skills
                .AnyAsync(s => s.Name.ToLower() == name.ToLower() && s.CategoryId == categoryId);
        }

        public async Task<bool> IsSkillInUseAsync(int skillId)
        {
            return await dbContext.UserSkills
                .AnyAsync(us => us.SkillId == skillId);
        }

        public async Task<IEnumerable<Skill>> GetByIdsAsync(IEnumerable<int> skillIds)
        {
            return await dbContext.Skills
                .Include(s => s.Category)
                .Where(s => skillIds.Contains(s.Id))
                .ToListAsync();
        }
    }
}
