using System.ComponentModel.DataAnnotations;

namespace CareerRoute.Core.DTOs.Mentors
{
    // DTO for updating an existing mentor profile
    // All fields are optional - only provided fields will be updated
    public class UpdateMentorProfileDto
    {
        // Mentor's bio/introduction (optional, min 100 chars if provided)
        [MinLength(100, ErrorMessage = "Bio must be at least 100 characters")]
        [MaxLength(2000, ErrorMessage = "Bio cannot exceed 2000 characters")]
        public string? Bio { get; set; }

        // List of expertise tags/skills (optional, min 3 tags if provided)
        [MinLength(3, ErrorMessage = "At least 3 expertise tags are required")]
        public List<string>? ExpertiseTags { get; set; }

        // Years of professional experience (optional, min 1 if provided)
        [Range(1, 60, ErrorMessage = "Years of experience must be between 1 and 60")]
        public int? YearsOfExperience { get; set; }

        // Professional certifications (optional)
        [MaxLength(1000, ErrorMessage = "Certifications cannot exceed 1000 characters")]
        public string? Certifications { get; set; }

        // Rate for 30-minute session in USD (optional, $20-$500 if provided)
        [Range(20, 500, ErrorMessage = "Rate for 30 minutes must be between $20 and $500")]
        public decimal? Rate30Min { get; set; }

        // Rate for 60-minute session in USD (optional, $20-$500 if provided)
        [Range(20, 500, ErrorMessage = "Rate for 60 minutes must be between $20 and $500")]
        public decimal? Rate60Min { get; set; }

        // Whether mentor is currently accepting new sessions (optional)
        public bool? IsAvailable { get; set; }

        // Category IDs for mentor's expertise areas (optional, 1-5 if provided)
        [MinLength(1, ErrorMessage = "At least one category is required")]
        [MaxLength(5, ErrorMessage = "Maximum 5 categories allowed")]
        public List<int>? CategoryIds { get; set; }
    }
}
