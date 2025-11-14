using CareerRoute.Core.Domain.Entities;

namespace CareerRoute.Core.Domain.Interfaces
{
    public interface ISkillRepository : IBaseRepository<Skill>
    {
        Task<Skill?> GetByIdWithCategoryAsync(int id);
        Task<IEnumerable<Skill>> GetAllActiveAsync();
        Task<IEnumerable<Skill>> GetByCategoryIdAsync(int categoryId, bool activeOnly = true);
        Task<bool> ExistsAsync(string name, int categoryId);
        Task<bool> IsSkillInUseAsync(int skillId);
        Task<IEnumerable<Skill>> GetByIdsAsync(IEnumerable<int> skillIds);
        Task<Skill?> GetByIdAsync(int id);
    }
}
