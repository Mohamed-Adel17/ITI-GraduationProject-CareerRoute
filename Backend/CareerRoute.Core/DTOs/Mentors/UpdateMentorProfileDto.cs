using System.ComponentModel.DataAnnotations;

namespace CareerRoute.Core.DTOs.Mentors
{
    /// <summary>
    /// DTO for updating an existing mentor profile
    /// All fields are optional - only provided fields will be updated
    /// Includes both User-related fields and Mentor-specific fields
    /// </summary>
    public class UpdateMentorProfileDto
    {
        // User-related fields (from ApplicationUser)
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ProfilePictureUrl { get; set; }
        
        // Mentor-specific fields
        public string? Bio { get; set; }
        public List<int>? ExpertiseTagIds { get; set; }
        public int? YearsOfExperience { get; set; }
        public string? Certifications { get; set; }
        public decimal? Rate30Min { get; set; }
        public decimal? Rate60Min { get; set; }
        public bool? IsAvailable { get; set; }
        public List<int>? CategoryIds { get; set; }
    }
}
