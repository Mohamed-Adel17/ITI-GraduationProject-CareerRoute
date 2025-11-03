using CareerRoute.Core.DTOs.Users;


namespace CareerRoute.Core.DTOs.Auth
{
    public class AuthResponseDto
    {

        public required string AccessToken { get; set; }
        public required string RefreshToken { get; set; }
        public required UserDto User { get; set; }
    }
}
