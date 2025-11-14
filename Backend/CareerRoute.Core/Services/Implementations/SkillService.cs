using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.Skills;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Extentions;
using CareerRoute.Core.Services.Interfaces;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace CareerRoute.Core.Services.Implementations
{
    public class SkillService : ISkillService
    {
        private readonly ISkillRepository _skillRepository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<SkillService> _logger;
        private readonly IValidator<CreateSkillDto> _createValidator;
        private readonly IValidator<UpdateSkillDto> _updateValidator;

        public SkillService(
            ISkillRepository skillRepository,
            ICategoryRepository categoryRepository,
            IMapper mapper,
            ILogger<SkillService> logger,
            IValidator<CreateSkillDto> createValidator,
            IValidator<UpdateSkillDto> updateValidator)
        {
            _skillRepository = skillRepository;
            _categoryRepository = categoryRepository;
            _mapper = mapper;
            _logger = logger;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
        }

        public async Task<IEnumerable<SkillDto>> GetAllSkillsAsync(int? categoryId = null, bool? isActive = true)
        {
            IEnumerable<Skill> skills;

            if (categoryId.HasValue)
            {
                skills = await _skillRepository.GetByCategoryIdAsync(categoryId.Value, isActive ?? true);
            }
            else if (isActive.HasValue && isActive.Value)
            {
                skills = await _skillRepository.GetAllActiveAsync();
            }
            else
            {
                skills = await _skillRepository.GetAllAsync();
            }

            return _mapper.Map<IEnumerable<SkillDto>>(skills);
        }

        public async Task<SkillDetailDto> GetSkillByIdAsync(int id)
        {
            var skill = await _skillRepository.GetByIdWithCategoryAsync(id);
            
            if (skill == null)
            {
                throw new NotFoundException("Skill", id.ToString());
            }

            return _mapper.Map<SkillDetailDto>(skill);
        }

        public async Task<SkillDetailDto> CreateSkillAsync(CreateSkillDto dto)
        {
            await _createValidator.ValidateAndThrowCustomAsync(dto);

            // Check if category exists
            var category = await _categoryRepository.GetByIdAsync(dto.CategoryId);
            if (category == null)
            {
                throw new Exceptions.ValidationException(new Dictionary<string, string[]>
                {
                    ["CategoryId"] = new[] { "Category does not exist" }
                });
            }

            // Check for duplicate skill name within the same category
            var exists = await _skillRepository.ExistsAsync(dto.Name, dto.CategoryId);
            if (exists)
            {
                throw new ConflictException($"Skill '{dto.Name}' already exists in this category");
            }

            var skill = _mapper.Map<Skill>(dto);
            skill.IsActive = true;
            skill.CreatedAt = DateTime.UtcNow;

            await _skillRepository.AddAsync(skill);
            await _skillRepository.SaveChangesAsync();

            _logger.LogInformation("Skill '{SkillName}' created successfully with ID: {SkillId}", skill.Name, skill.Id);

            // Reload with category to get complete data
            return await GetSkillByIdAsync(skill.Id);
        }

        public async Task<SkillDetailDto> UpdateSkillAsync(int id, UpdateSkillDto dto)
        {
            await _updateValidator.ValidateAndThrowCustomAsync(dto);

            var skill = await _skillRepository.GetByIdWithCategoryAsync(id);
            if (skill == null)
            {
                throw new NotFoundException("Skill", id.ToString());
            }

            // Check if name is being changed and if new name already exists
            if (dto.Name != null && dto.Name != skill.Name)
            {
                var targetCategoryId = dto.CategoryId ?? skill.CategoryId;
                var exists = await _skillRepository.ExistsAsync(dto.Name, targetCategoryId);
                if (exists)
                {
                    throw new ConflictException($"Skill name '{dto.Name}' already exists in the target category");
                }
                skill.Name = dto.Name;
            }

            // Update category if provided and different
            if (dto.CategoryId.HasValue && dto.CategoryId.Value != skill.CategoryId)
            {
                var category = await _categoryRepository.GetByIdAsync(dto.CategoryId.Value);
                if (category == null)
                {
                    throw new Exceptions.ValidationException(new Dictionary<string, string[]>
                    {
                        ["CategoryId"] = new[] { "Category does not exist" }
                    });
                }
                skill.CategoryId = dto.CategoryId.Value;
            }

            // Update isActive if provided
            if (dto.IsActive.HasValue)
            {
                skill.IsActive = dto.IsActive.Value;
            }

            skill.UpdatedAt = DateTime.UtcNow;

            _skillRepository.Update(skill);
            await _skillRepository.SaveChangesAsync();

            _logger.LogInformation("Skill '{SkillName}' (ID: {SkillId}) updated successfully", skill.Name, skill.Id);

            return await GetSkillByIdAsync(id);
        }

        public async Task DeleteSkillAsync(int id)
        {
            var skill = await _skillRepository.GetByIdAsync(id);
            if (skill == null)
            {
                throw new NotFoundException("Skill", id.ToString());
            }

            // Check if skill is in use
            var isInUse = await _skillRepository.IsSkillInUseAsync(id);
            if (isInUse)
            {
                throw new ConflictException($"Cannot delete skill '{skill.Name}'. It is currently being used by users or mentors");
            }

            _skillRepository.Delete(skill);
            await _skillRepository.SaveChangesAsync();

            _logger.LogInformation("Skill '{SkillName}' (ID: {SkillId}) deleted successfully", skill.Name, id);
        }

        public async Task<bool> ValidateSkillIdsAsync(IEnumerable<int> skillIds)
        {
            if (skillIds == null || !skillIds.Any())
            {
                return true; // Empty list is valid (will clear skills)
            }

            var skills = await _skillRepository.GetByIdsAsync(skillIds);
            var foundIds = skills.Select(s => s.Id).ToList();
            var requestedIds = skillIds.Distinct().ToList();

            // Check if all requested IDs were found
            if (foundIds.Count != requestedIds.Count)
            {
                return false;
            }

            // Check if all skills are active
            if (skills.Any(s => !s.IsActive))
            {
                return false;
            }

            return true;
        }
    }
}
