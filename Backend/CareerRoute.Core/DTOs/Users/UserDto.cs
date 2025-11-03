
namespace CareerRoute.Core.DTOs.Users
{
    public class UserDto
    {
        public required string Id { get; set; }
        public required string Email { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public bool EmailConfirmed { get; set; }
        public List<string> Roles { get; set; } = [];
        public bool IsMentor { get; set; }
        public string? ProfilePictureUrl { get; set; }


    }
}
