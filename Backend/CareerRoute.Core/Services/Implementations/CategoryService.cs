using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.Categories;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Extentions;
using CareerRoute.Core.Services.Interfaces;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace CareerRoute.Core.Services.Implementations
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _categoryRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<CategoryService> _logger;
        private readonly IValidator<CreateCategoryDto> _createValidator;
        private readonly IValidator<UpdateCategoryDto> _updateValidator;

        public CategoryService(
            ICategoryRepository categoryRepository,
            IMapper mapper,
            ILogger<CategoryService> logger,
            IValidator<CreateCategoryDto> createValidator,
            IValidator<UpdateCategoryDto> updateValidator)
        {
            _categoryRepository = categoryRepository;
            _mapper = mapper;
            _logger = logger;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
        }

        public async Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync()
        {
            var categories = await _categoryRepository.GetAllActiveAsync();
            return _mapper.Map<IEnumerable<CategoryDto>>(categories);
        }

        public async Task<CategoryDto> GetCategoryByIdAsync(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            
            if (category == null)
            {
                throw new NotFoundException("Category", id.ToString());
            }

            return _mapper.Map<CategoryDto>(category);
        }

        public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto)
        {
            await _createValidator.ValidateAndThrowCustomAsync(dto);

            // Check for duplicate category name
            var exists = await _categoryRepository.ExistsAsync(dto.Name);
            if (exists)
            {
                throw new ConflictException($"Category with name '{dto.Name}' already exists");
            }

            var category = _mapper.Map<Category>(dto);
            category.IsActive = true;
            category.CreatedAt = DateTime.UtcNow;

            await _categoryRepository.AddAsync(category);
            await _categoryRepository.SaveChangesAsync();

            _logger.LogInformation("Category '{CategoryName}' created successfully with ID: {CategoryId}", category.Name, category.Id);

            return _mapper.Map<CategoryDto>(category);
        }

        public async Task<CategoryDto> UpdateCategoryAsync(int id, UpdateCategoryDto dto)
        {
            await _updateValidator.ValidateAndThrowCustomAsync(dto);

            var category = await _categoryRepository.GetByIdAsync(id);
            if (category == null)
            {
                throw new NotFoundException("Category", id.ToString());
            }

            // Check if name is being changed and if new name already exists
            if (dto.Name != null && dto.Name != category.Name)
            {
                var exists = await _categoryRepository.ExistsAsync(dto.Name);
                if (exists)
                {
                    throw new ConflictException($"Category name '{dto.Name}' already exists");
                }
                category.Name = dto.Name;
            }

            // Update other fields if provided
            if (dto.Description != null)
            {
                category.Description = dto.Description;
            }

            if (dto.IconUrl != null)
            {
                category.IconUrl = dto.IconUrl;
            }

            if (dto.IsActive.HasValue)
            {
                category.IsActive = dto.IsActive.Value;
            }

            category.UpdatedAt = DateTime.UtcNow;

            _categoryRepository.Update(category);
            await _categoryRepository.SaveChangesAsync();

            _logger.LogInformation("Category '{CategoryName}' (ID: {CategoryId}) updated successfully", category.Name, category.Id);

            return _mapper.Map<CategoryDto>(category);
        }

        public async Task DeleteCategoryAsync(int id)
        {
            var category = await _categoryRepository.GetByIdWithSkillsAsync(id);
            if (category == null)
            {
                throw new NotFoundException("Category", id.ToString());
            }

            // Check if category has skills
            if (category.Skills != null && category.Skills.Any())
            {
                throw new ConflictException($"Cannot delete category '{category.Name}'. It has {category.Skills.Count} skill(s) associated with it");
            }

            _categoryRepository.Delete(category);
            await _categoryRepository.SaveChangesAsync();

            _logger.LogInformation("Category '{CategoryName}' (ID: {CategoryId}) deleted successfully", category.Name, id);
        }
    }
}
