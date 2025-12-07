using CareerRoute.Core.DTOs.Categories;

namespace CareerRoute.Core.Services.Interfaces
{
    public interface ICategoryService
    {
        Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync(bool includeInactive = false);
        Task<CategoryDto> GetCategoryByIdAsync(int id);
        Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto);
        Task<CategoryDto> UpdateCategoryAsync(int id, UpdateCategoryDto dto);
        Task DeleteCategoryAsync(int id);
    }
}
