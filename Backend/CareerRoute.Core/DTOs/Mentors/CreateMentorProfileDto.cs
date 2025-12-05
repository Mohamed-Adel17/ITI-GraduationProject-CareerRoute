using Microsoft.AspNetCore.Http;

namespace CareerRoute.Core.DTOs.Mentors
{
    // DTO for creating a new mentor profile (mentor application)
    // ExpertiseTagIds is optional - expertise can be added after approval
    public class CreateMentorProfileDto
    {
        public string Bio { get; set; } = string.Empty;
        public List<int>? ExpertiseTagIds { get; set; }
        public int YearsOfExperience { get; set; }
        public string? Certifications { get; set; }
        public decimal Rate30Min { get; set; }
        public decimal Rate60Min { get; set; }
        public List<int> CategoryIds { get; set; } = new();
        public IFormFile? Cv { get; set; }
    }
}
