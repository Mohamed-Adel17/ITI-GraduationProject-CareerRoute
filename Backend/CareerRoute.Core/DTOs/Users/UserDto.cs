
namespace CareerRoute.Core.DTOs.Users
{
    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public bool EmailConfirmed { get; set; }
        public List<string> Roles { get; set; } = [];
        public bool IsMentor { get; set; }
        public string? ProfilePictureUrl { get; set; }
    }
}
