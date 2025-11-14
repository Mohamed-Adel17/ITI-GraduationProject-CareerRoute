namespace CareerRoute.Core.DTOs.Categories
{
    public class UpdateCategoryDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? IconUrl { get; set; }
        public bool? IsActive { get; set; }
    }
}
