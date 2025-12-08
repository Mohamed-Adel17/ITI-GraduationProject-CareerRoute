using Microsoft.AspNetCore.Http;

namespace CareerRoute.Core.DTOs.Auth
{
    public class RegisterRequestDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public bool RegisterAsMentor { get; set; } = false;
        public IFormFile? ProfilePicture { get; set; }
    }
}
