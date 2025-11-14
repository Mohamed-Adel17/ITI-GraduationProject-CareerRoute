using System.ComponentModel.DataAnnotations;

namespace CareerRoute.Core.DTOs.Mentors
{
    /// <summary>
    /// Request DTO for searching and filtering mentors with pagination
    /// </summary>
    public class MentorSearchRequestDto
    {
        /// <summary>
        /// Search keywords (searches in mentor name, bio, certifications, and skills)
        /// </summary>
        /// <example>React</example>
        public string? Keywords { get; set; }

        /// <summary>
        /// Filter by category ID (e.g., 1=IT Careers, 2=Leadership, 3=Finance)
        /// </summary>
        /// <example>1</example>
        public int? CategoryId { get; set; }

        /// <summary>
        /// Minimum price for 30-minute session
        /// </summary>
        /// <example>20</example>
        public decimal? MinPrice { get; set; }

        /// <summary>
        /// Maximum price for 30-minute session
        /// </summary>
        /// <example>50</example>
        public decimal? MaxPrice { get; set; }

        /// <summary>
        /// Minimum average rating (0-5 scale)
        /// </summary>
        /// <example>4.0</example>
        public decimal? MinRating { get; set; }

        /// <summary>
        /// Sort order: popularity, rating, priceAsc, priceDesc, experience
        /// </summary>
        /// <example>rating</example>
        public string SortBy { get; set; } = "popularity";

        /// <summary>
        /// Page number for pagination
        /// </summary>
        /// <example>1</example>
        public int Page { get; set; } = 1;

        /// <summary>
        /// Number of items per page (1-50)
        /// </summary>
        /// <example>12</example>
        public int PageSize { get; set; } = 12;
    }
}
