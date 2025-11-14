using CareerRoute.Core.DTOs.Skills;

namespace CareerRoute.Core.Services.Interfaces
{
    public interface ISkillService
    {
        Task<IEnumerable<SkillDto>> GetAllSkillsAsync(int? categoryId = null, bool? isActive = true);
        Task<SkillDetailDto> GetSkillByIdAsync(int id);
        Task<SkillDetailDto> CreateSkillAsync(CreateSkillDto dto);
        Task<SkillDetailDto> UpdateSkillAsync(int id, UpdateSkillDto dto);
        Task DeleteSkillAsync(int id);
        Task<bool> ValidateSkillIdsAsync(IEnumerable<int> skillIds);
    }
}
