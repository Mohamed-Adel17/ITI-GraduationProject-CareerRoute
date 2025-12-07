using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CareerRoute.Infrastructure.Repositories
{
    public class CategoryRepository : GenericRepository<Category>, ICategoryRepository
    {
        public CategoryRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }

        public async Task<Category?> GetByIdAsync(int id)
        {
            return await dbContext.Categories.FindAsync(id);
        }

        public async Task<Category?> GetByNameAsync(string name)
        {
            return await dbContext.Categories
                .FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());
        }

        public async Task<IEnumerable<Category>> GetAllActiveAsync()
        {
            return await dbContext.Categories
                .Where(c => c.IsActive)
                .OrderBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<IEnumerable<Category>> GetAllAsync()
        {
            return await dbContext.Categories
                .OrderBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<Category?> GetByIdWithSkillsAsync(int id)
        {
            return await dbContext.Categories
                .Include(c => c.Skills.Where(s => s.IsActive))
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<bool> ExistsAsync(string name)
        {
            return await dbContext.Categories
                .AnyAsync(c => c.Name.ToLower() == name.ToLower());
        }

        public async Task<Dictionary<int, int>> GetMentorCountsAsync()
        {
            return await dbContext.MentorCategories
                .Where(mc => mc.Mentor.ApprovalStatus == MentorApprovalStatus.Approved)
                .GroupBy(mc => mc.CategoryId)
                .Select(g => new { CategoryId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CategoryId, x => x.Count);
        }
    }
}
