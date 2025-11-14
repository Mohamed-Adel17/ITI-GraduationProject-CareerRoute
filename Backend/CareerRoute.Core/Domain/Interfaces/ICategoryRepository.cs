using CareerRoute.Core.Domain.Entities;

namespace CareerRoute.Core.Domain.Interfaces
{
    public interface ICategoryRepository : IBaseRepository<Category>
    {
        Task<Category?> GetByNameAsync(string name);
        Task<IEnumerable<Category>> GetAllActiveAsync();
        Task<Category?> GetByIdWithSkillsAsync(int id);
        Task<bool> ExistsAsync(string name);
        Task<Category?> GetByIdAsync(int id);
    }
}
