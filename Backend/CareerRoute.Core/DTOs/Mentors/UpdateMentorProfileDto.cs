using System.ComponentModel.DataAnnotations;

namespace CareerRoute.Core.DTOs.Mentors
{
    // DTO for updating an existing mentor profile
    // All fields are optional - only provided fields will be updated
    public class UpdateMentorProfileDto
    {
        public string? Bio { get; set; }
        public List<string>? ExpertiseTags { get; set; }
        public int? YearsOfExperience { get; set; }
        public string? Certifications { get; set; }
        public decimal? Rate30Min { get; set; }
        public decimal? Rate60Min { get; set; }
        public bool? IsAvailable { get; set; }
        public List<int>? CategoryIds { get; set; }
    }
}
