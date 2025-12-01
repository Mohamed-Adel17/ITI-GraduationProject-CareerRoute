namespace CareerRoute.Core.DTOs.Mentors
{
    /// <summary>
    /// Applied filters for frontend state management
    /// </summary>
    public class AppliedFiltersDto
    {
        public string? Keywords { get; set; }
        public int? CategoryId { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public decimal? MinRating { get; set; }
        public string SortBy { get; set; } = "popularity";
    }
}
