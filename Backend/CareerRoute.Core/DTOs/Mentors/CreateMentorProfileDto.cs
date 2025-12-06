using Microsoft.AspNetCore.Http;

namespace CareerRoute.Core.DTOs.Mentors
{
    public class CreateMentorProfileDto
    {
        public string? Headline { get; set; }
        public string Bio { get; set; } = string.Empty;
        public List<int>? ExpertiseTagIds { get; set; }
        public int YearsOfExperience { get; set; }
        public string? Certifications { get; set; }
        public decimal Rate30Min { get; set; }
        public decimal Rate60Min { get; set; }
        public List<int> CategoryIds { get; set; } = new();
        public IFormFile? Cv { get; set; }
        public string? LinkedInUrl { get; set; }
        public string? GitHubUrl { get; set; }
        public string? WebsiteUrl { get; set; }
        public List<CreatePreviousWorkDto>? PreviousWorks { get; set; }
    }
}
