using CareerRoute.Core.DTOs.Users;


namespace CareerRoute.Core.DTOs.Auth
{
    public class AuthResponseDto
    {

        public string Token { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public UserDto User { get; set; }=new UserDto();
    }
}
