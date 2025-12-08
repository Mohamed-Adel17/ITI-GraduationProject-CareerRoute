using Microsoft.AspNetCore.Http;

namespace CareerRoute.Core.DTOs.Mentors
{
    public class UpdateMentorProfileDto
    {
        // User-related fields
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public IFormFile? ProfilePicture { get; set; }
        
        // Mentor-specific fields
        public string? Headline { get; set; }
        public string? Bio { get; set; }
        public List<int>? ExpertiseTagIds { get; set; }
        public int? YearsOfExperience { get; set; }
        public string? Certifications { get; set; }
        public decimal? Rate30Min { get; set; }
        public decimal? Rate60Min { get; set; }
        public bool? IsAvailable { get; set; }
        public List<int>? CategoryIds { get; set; }
        public IFormFile? Cv { get; set; }
        public string? LinkedInUrl { get; set; }
        public string? GitHubUrl { get; set; }
        public string? WebsiteUrl { get; set; }
    }
}
