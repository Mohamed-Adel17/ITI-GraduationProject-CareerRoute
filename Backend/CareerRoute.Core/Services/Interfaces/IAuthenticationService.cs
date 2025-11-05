using CareerRoute.Core.DTOs.Auth;

namespace CareerRoute.Core.Services.Interfaces
{
    public interface IAuthenticationService
    {
        Task<RegisterResponseDto> Register(RegisterRequestDto registerRequest);
        Task<AuthResponseDto> VerifyEmail(VerifyEmailRequestDto verifyEmailRequest);
        Task RequestVerifyEmail(EmailRequestDto emailRequest);
        Task<AuthResponseDto> Login(LoginRequestDto loginRequest);

        Task<AuthResponseDto> RefreshToken(TokenRequestDto tokenRequest);

        Task Logout(string userId);

        Task ForgotPassword(EmailRequestDto emailRequest);
        Task<AuthResponseDto> ResetPassword(ResetPasswordRequestDto resetPasswordRequest);
        Task ChangePassword(string userId, ChangePasswordRequestDto changePasswordRequest);


    }
}
