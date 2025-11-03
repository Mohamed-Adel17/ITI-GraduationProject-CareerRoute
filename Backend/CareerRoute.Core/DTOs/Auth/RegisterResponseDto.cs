

namespace CareerRoute.Core.DTOs.Auth
{
    public class RegisterResponseDto
    {
        public required string UserId { get; set; }
        public required string Message { get; set; }
        public required string Email { get; set; }
    }
}
