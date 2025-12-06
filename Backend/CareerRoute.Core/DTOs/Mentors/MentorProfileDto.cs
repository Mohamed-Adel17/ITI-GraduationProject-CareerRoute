using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Categories;
using CareerRoute.Core.DTOs.Skills;

namespace CareerRoute.Core.DTOs.Mentors
{
    public class MentorProfileDto
    {
        public string Id { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName => $"{FirstName} {LastName}";
        public string Email { get; set; } = string.Empty;
        public string? ProfilePictureUrl { get; set; }
        public string? Headline { get; set; }
        public string? Bio { get; set; }
        public List<SkillDto> ExpertiseTags { get; set; } = new();
        public int? YearsOfExperience { get; set; }
        public string? Certifications { get; set; }
        public decimal Rate30Min { get; set; }
        public decimal Rate60Min { get; set; }
        public decimal AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public int TotalSessionsCompleted { get; set; }
        public bool IsVerified { get; set; }
        public MentorApprovalStatus ApprovalStatus { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? CvUrl { get; set; }
        public string? LinkedInUrl { get; set; }
        public string? GitHubUrl { get; set; }
        public string? WebsiteUrl { get; set; }
        public List<PreviousWorkDto> PreviousWorks { get; set; } = new();

        // Optional fields for detailed views
        public List<CategoryDto>? Categories { get; set; }
        public string? ResponseTime { get; set; }
        public decimal? CompletionRate { get; set; }
        public bool? IsAvailable { get; set; }
    }
}
