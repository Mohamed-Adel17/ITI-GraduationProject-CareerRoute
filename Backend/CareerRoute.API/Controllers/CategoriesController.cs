using CareerRoute.API.Models;
using CareerRoute.Core.DTOs.Categories;
using CareerRoute.Core.DTOs.Mentors;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CareerRoute.API.Controllers
{
    /// <summary>
    /// Manages categories for skills organization
    /// </summary>
    [Route("api/categories")]
    [ApiController]
    [Produces("application/json")]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _categoryService;
        private readonly IMentorService _mentorService;
        private readonly ILogger<CategoriesController> _logger;

        public CategoriesController(
            ICategoryService categoryService, 
            IMentorService mentorService,
            ILogger<CategoriesController> logger)
        {
            _categoryService = categoryService;
            _mentorService = mentorService;
            _logger = logger;
        }

        /// <summary>
        /// Get all categories (Public)
        /// </summary>
        /// <returns>List of all active categories</returns>
        /// <response code="200">Returns list of categories</response>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<CategoryDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetAllCategories()
        {
            var categories = await _categoryService.GetAllCategoriesAsync();
            return Ok(new ApiResponse<IEnumerable<CategoryDto>>(categories, "Categories retrieved successfully"));
        }

        /// <summary>
        /// Get category by ID (Public)
        /// </summary>
        /// <param name="id">Category ID</param>
        /// <returns>Category details</returns>
        /// <response code="200">Returns the category</response>
        /// <response code="404">Category not found</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<CategoryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetCategoryById(int id)
        {
            var category = await _categoryService.GetCategoryByIdAsync(id);
            return Ok(new ApiResponse<CategoryDto>(category, "Category retrieved successfully"));
        }

        /// <summary>
        /// Create a new category (Admin only)
        /// </summary>
        /// <param name="dto">Category creation data</param>
        /// <returns>Created category</returns>
        /// <response code="201">Category created successfully</response>
        /// <response code="400">Validation failed</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden - Admin access required</response>
        /// <response code="409">Category already exists</response>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<CategoryDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
        {
            _logger.LogInformation("Admin creating new category: {CategoryName}", dto.Name);

            var category = await _categoryService.CreateCategoryAsync(dto);

            return CreatedAtAction(
                nameof(GetCategoryById),
                new { id = category.Id },
                new ApiResponse<CategoryDto>(
                    category,
                    "Category created successfully",
                    StatusCodes.Status201Created));
        }

        /// <summary>
        /// Update a category (Admin only)
        /// </summary>
        /// <param name="id">Category ID</param>
        /// <param name="dto">Category update data</param>
        /// <returns>Updated category</returns>
        /// <response code="200">Category updated successfully</response>
        /// <response code="400">Validation failed</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden - Admin access required</response>
        /// <response code="404">Category not found</response>
        /// <response code="409">Category name already exists</response>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<CategoryDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult> UpdateCategory(int id, [FromBody] UpdateCategoryDto dto)
        {
            _logger.LogInformation("Admin updating category ID: {CategoryId}", id);

            var category = await _categoryService.UpdateCategoryAsync(id, dto);

            return Ok(new ApiResponse<CategoryDto>(category, "Category updated successfully"));
        }

        /// <summary>
        /// Delete a category (Admin only)
        /// </summary>
        /// <param name="id">Category ID</param>
        /// <returns>Success message</returns>
        /// <response code="200">Category deleted successfully</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden - Admin access required</response>
        /// <response code="404">Category not found</response>
        /// <response code="409">Category has skills and cannot be deleted</response>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult> DeleteCategory(int id)
        {
            _logger.LogInformation("Admin deleting category ID: {CategoryId}", id);

            await _categoryService.DeleteCategoryAsync(id);

            return Ok(new ApiResponse { Message = "Category deleted successfully" });
        }

        /// <summary>
        /// Get mentors by category with pagination and sorting (Public)
        /// </summary>
        /// <param name="id">Category ID</param>
        /// <param name="request">Search and pagination parameters</param>
        /// <returns>Paginated list of mentors in this category</returns>
        /// <response code="200">Returns mentors in the category with pagination</response>
        /// <response code="404">Category not found or no mentors in category</response>
        [HttpGet("{id}/mentors")]
        [ProducesResponseType(typeof(ApiResponse<MentorSearchResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetMentorsByCategory(int id, [FromQuery] MentorSearchRequestDto request)
        {
            _logger.LogInformation("Fetching mentors for category ID: {CategoryId}", id);

            // Verify category exists
            var category = await _categoryService.GetCategoryByIdAsync(id);

            // Override categoryId with path parameter
            request.CategoryId = id;

            // Use advanced search with category filter
            var result = await _mentorService.SearchMentorsAsync(request);

            if (result.Mentors.Count == 0)
            {
                return NotFound(new ApiResponse
                {
                    Success = false,
                    Message = "No mentors found in this category",
                    StatusCode = 404
                });
            }

            return Ok(new ApiResponse<MentorSearchResponseDto>(result, "Mentors retrieved successfully"));
        }
    }
}
