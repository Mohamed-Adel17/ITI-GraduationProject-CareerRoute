using CareerRoute.Core.Domain.Entities;
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

        public async Task<Category?> GetByNameAsync(string name)
        {
            return await dbContext.Categories
                .FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());
        }

    }
}
