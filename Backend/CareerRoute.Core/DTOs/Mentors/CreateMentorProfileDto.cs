using System.ComponentModel.DataAnnotations;

namespace CareerRoute.Core.DTOs.Mentors
{
    // DTO for creating a new mentor profile (mentor application)
    // All fields are required except Certifications
    public class CreateMentorProfileDto
    {
        // Mentor's bio/introduction (required, min 100 chars)
        [Required(ErrorMessage = "Bio is required")]
        [MinLength(100, ErrorMessage = "Bio must be at least 100 characters")]
        [MaxLength(2000, ErrorMessage = "Bio cannot exceed 2000 characters")]
        public string Bio { get; set; } = string.Empty;

        // List of expertise tags/skills (required, min 3 tags)
        [Required(ErrorMessage = "Expertise tags are required")]
        [MinLength(3, ErrorMessage = "At least 3 expertise tags are required")]
        public List<string> ExpertiseTags { get; set; } = new();

        // Years of professional experience (required, min 1)
        [Required(ErrorMessage = "Years of experience is required")]
        [Range(1, 60, ErrorMessage = "Years of experience must be between 1 and 60")]
        public int YearsOfExperience { get; set; }

        // Professional certifications (optional)
        [MaxLength(1000, ErrorMessage = "Certifications cannot exceed 1000 characters")]
        public string? Certifications { get; set; }

        // Rate for 30-minute session in USD (required, $20-$500)
        [Required(ErrorMessage = "30-minute rate is required")]
        [Range(20, 500, ErrorMessage = "Rate for 30 minutes must be between $20 and $500")]
        public decimal Rate30Min { get; set; }

        // Rate for 60-minute session in USD (required, $20-$500)
        [Required(ErrorMessage = "60-minute rate is required")]
        [Range(20, 500, ErrorMessage = "Rate for 60 minutes must be between $20 and $500")]
        public decimal Rate60Min { get; set; }

        // Category IDs for mentor's expertise areas (required, 1-5 categories)
        [Required(ErrorMessage = "At least one category is required")]
        [MinLength(1, ErrorMessage = "At least one category is required")]
        [MaxLength(5, ErrorMessage = "Maximum 5 categories allowed")]
        public List<int> CategoryIds { get; set; } = new();
    }
}
