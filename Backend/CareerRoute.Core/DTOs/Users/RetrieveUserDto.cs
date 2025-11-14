using CareerRoute.Core.DTOs.Skills;

namespace CareerRoute.Core.DTOs.Users
{
    public class RetrieveUserDto
    {
        public string Id { get; set; }
        public string UserName { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ProfilePictureUrl { get; set; }
        public string? CareerGoal { get; set; }
        public List<SkillDto>? CareerInterests { get; set; }
        public string Role { get; set; }
        public bool IsActive { get; set; }
        public DateTime RegistrationDate { get; set; } 
        public DateTime? LastLoginDate { get; set; }
    }
}
