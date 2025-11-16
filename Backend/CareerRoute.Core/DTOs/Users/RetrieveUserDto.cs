using CareerRoute.Core.DTOs.Skills;

namespace CareerRoute.Core.DTOs.Users
{
    /// <summary>
    /// DTO for retrieving user profile information
    /// Matches the User Profile Endpoints API contract
    /// Only for users where IsMentor = false
    /// </summary>
    public class RetrieveUserDto
    {
        public string Id { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public bool EmailConfirmed { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public List<SkillDto>? CareerInterests { get; set; }
        public string? CareerGoals { get; set; }
        public DateTime RegistrationDate { get; set; } 
        public DateTime? LastLoginDate { get; set; }
        public bool IsActive { get; set; }
        public List<string> Roles { get; set; }
        public bool IsMentor { get; set; }
    }
}
