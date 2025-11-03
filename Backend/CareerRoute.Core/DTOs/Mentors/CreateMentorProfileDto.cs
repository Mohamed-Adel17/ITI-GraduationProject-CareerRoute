using System.ComponentModel.DataAnnotations;

namespace CareerRoute.Core.DTOs.Mentors
{
    // DTO for creating a new mentor profile (mentor application)
    // All fields are required except Certifications
    public class CreateMentorProfileDto
    {
        public string Bio { get; set; } = string.Empty;
        public List<string> ExpertiseTags { get; set; } = new();
        public int YearsOfExperience { get; set; }
        public string? Certifications { get; set; }
        public decimal Rate30Min { get; set; }
        public decimal Rate60Min { get; set; }
        public List<int> CategoryIds { get; set; } = new();
    }
}
