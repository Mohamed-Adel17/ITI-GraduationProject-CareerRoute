using AutoMapper;
using CareerRoute.Core.Constants;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.Auth;
using CareerRoute.Core.DTOs.Users;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Setting;
using FluentValidation;
using CareerRoute.Core.Extentions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using CareerRoute.Core.Domain.Interfaces.Services;

namespace CareerRoute.Core.Services.Implementations
{

    public class AuthenticationService : IAuthenticationService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly ITokenService _tokenService;
        private readonly ITokenRepository _tokenRepository;
        private readonly IEmailService _emailService;
        private readonly IMapper _mapper;
        private readonly JwtSettings _jwtSettings;
        private readonly string _frontendUrl;
        private readonly IValidator<RegisterRequestDto> _registerValidator;
        private readonly IValidator<LoginRequestDto> _loginValidator;
        private readonly IValidator<EmailRequestDto> _emailValidator;
        private readonly IValidator<VerifyEmailRequestDto> _verifyEmailValidator;
        private readonly IValidator<ResetPasswordRequestDto> _resetPasswordValidator;
        private readonly IValidator<ChangePasswordRequestDto> _changePasswordValidator;
        private readonly IValidator<TokenRequestDto> _tokenValidator;

        public AuthenticationService(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            ITokenService tokenService,
            ITokenRepository tokenRepository,
            IEmailService emailService,
            IOptions<JwtSettings> jwtSettings,
            IMapper mapper,
            IConfiguration configuration,
            IValidator<RegisterRequestDto> registerValidator,
            IValidator<LoginRequestDto> loginValidator,
            IValidator<EmailRequestDto> emailValidator,
            IValidator<VerifyEmailRequestDto> verifyEmailValidator,
            IValidator<ResetPasswordRequestDto> resetPasswordValidator,
            IValidator<ChangePasswordRequestDto> changePasswordValidator,
            IValidator<TokenRequestDto> tokenValidator)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _tokenRepository = tokenRepository;
            _emailService = emailService;
            _mapper = mapper;
            _jwtSettings = jwtSettings.Value;
            _frontendUrl = configuration["FrontendUrl"] ?? "http://localhost:4200";
            _registerValidator = registerValidator;
            _loginValidator = loginValidator;
            _emailValidator = emailValidator;
            _verifyEmailValidator = verifyEmailValidator;
            _resetPasswordValidator = resetPasswordValidator;
            _changePasswordValidator = changePasswordValidator;
            _tokenValidator = tokenValidator;
        }

        public async Task<RegisterResponseDto> Register(RegisterRequestDto registerRequest)
        {
            await _registerValidator.ValidateAndThrowCustomAsync(registerRequest);

            await EnsureUserDoesNotExist(registerRequest.Email);

            var user = CreateUserFromRequest(registerRequest);
            await CreateUserWithRole(user, registerRequest.Password, registerRequest.RegisterAsMentor);

            await SendEmailVerification(user);

            return new RegisterResponseDto
            {
                UserId = user.Id,
                Email = user.Email!,
                RegisterAsMentor = registerRequest.RegisterAsMentor
            };
        }

        public async Task<AuthResponseDto> Login(LoginRequestDto loginRequest)
        {
            await _loginValidator.ValidateAndThrowCustomAsync<LoginRequestDto>(loginRequest);

            var user = await ValidateUserForLogin(loginRequest.Email, loginRequest.Password);

            await UpdateLastLoginDate(user);

            var tokens = await GenerateAndStoreTokens(user);

            return await CreateAuthResponse(user, tokens.accessToken, tokens.refreshToken);
        }

        public async Task<AuthResponseDto> RefreshToken(TokenRequestDto tokenRequest)
        {
            await _tokenValidator.ValidateAndThrowCustomAsync(tokenRequest);

            var refreshToken = await ValidateRefreshToken(tokenRequest.RefreshToken);
            var user = await GetActiveUser(refreshToken.UserId);

            await RevokeToken(refreshToken.Token);

            var tokens = await GenerateAndStoreTokens(user);

            return await CreateAuthResponse(user, tokens.accessToken, tokens.refreshToken);
        }

        public async Task ForgotPassword(EmailRequestDto emailRequest)
        {
            await _emailValidator.ValidateAndThrowCustomAsync(emailRequest);

            var user = await _userManager.FindByEmailAsync(emailRequest.Email);
            if (user == null) return; // Don't reveal user existence

            if (!user.EmailConfirmed)
            {
                throw new BusinessException("Please verify your email first.");
            }

            await SendPasswordResetEmail(user);
        }

        public async Task<AuthResponseDto> ResetPassword(ResetPasswordRequestDto resetPasswordRequest)
        {
            await _resetPasswordValidator.ValidateAndThrowCustomAsync(resetPasswordRequest);

            var user = await GetUserByEmail(resetPasswordRequest.Email);

            await ResetUserPassword(user, resetPasswordRequest.Token, resetPasswordRequest.NewPassword);
            await RevokeAllUserTokens(user.Id);

            var tokens = await GenerateAndStoreTokens(user);

            return await CreateAuthResponse(user, tokens.accessToken, tokens.refreshToken);
        }

        public async Task ChangePassword(string userId, ChangePasswordRequestDto changePasswordRequest)
        {
            await _changePasswordValidator.ValidateAndThrowCustomAsync(changePasswordRequest);

            var user = await GetUserById(userId);

            var result = await _userManager.ChangePasswordAsync(
                user,
                changePasswordRequest.CurrentPassword,
                changePasswordRequest.NewPassword);

            if (!result.Succeeded)
            {
                throw new BusinessException($"Password change failed: {GetErrorMessages(result)}");
            }

            await RevokeAllUserTokens(user.Id);
        }

        public async Task Logout(string userId)
        {
            await RevokeAllUserTokens(userId);
            await _signInManager.SignOutAsync();
        }

        public async Task RequestVerifyEmail(EmailRequestDto emailRequest)
        {
            await _emailValidator.ValidateAndThrowCustomAsync(emailRequest);

            var user = await GetUserByEmail(emailRequest.Email);

            if (user.EmailConfirmed)
            {
                throw new BusinessException("Email is already verified.");
            }

            await SendEmailVerification(user);
        }

        public async Task<AuthResponseDto> VerifyEmail(VerifyEmailRequestDto verifyEmailRequest)
        {
            await _verifyEmailValidator.ValidateAndThrowCustomAsync(verifyEmailRequest);

            var user = await GetUserByEmail(verifyEmailRequest.Email);

            if (user.EmailConfirmed)
            {
                throw new BusinessException("Email is already verified.");
            }

            await ConfirmUserEmail(user, verifyEmailRequest.Token);

            var tokens = await GenerateAndStoreTokens(user);

            return await CreateAuthResponse(user, tokens.accessToken, tokens.refreshToken);
        }

        #region Private Helper Methods

        private async Task EnsureUserDoesNotExist(string email)
        {
            var existingUser = await _userManager.FindByEmailAsync(email);
            if (existingUser != null)
            {
                throw new BusinessException("User with this email already exists.");
            }
        }

        private ApplicationUser CreateUserFromRequest(RegisterRequestDto request)
        {
            return new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                EmailConfirmed = false,
                RegistrationDate = DateTime.UtcNow,
                IsActive = true,
                IsMentor = request.RegisterAsMentor
            };
        }

        private async Task CreateUserWithRole(ApplicationUser user, string password, bool registerAsMentor)
        {
            var result = await _userManager.CreateAsync(user, password);
            if (!result.Succeeded)
            {
                throw new BusinessException($"Failed to create user: {GetErrorMessages(result)}");
            }

            // Always assign User role at registration
            // Mentor role will be assigned by admin after application approval
            await _userManager.AddToRoleAsync(user, AppRoles.User);
        }

        private async Task<ApplicationUser> ValidateUserForLogin(string email, string password)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                throw new UnauthenticatedException("Invalid email or password.");
            }

            if (!user.IsActive)
            {
                throw new UnauthenticatedException("Account is deactivated.");
            }

            if (!user.EmailConfirmed)
            {
                throw new UnauthenticatedException("Please verify your email before logging in.");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);

            if (result.IsLockedOut)
            {
                throw new UnauthenticatedException("Account is locked due to multiple failed login attempts.");
            }

            if (!result.Succeeded)
            {
                throw new UnauthenticatedException("Invalid email or password.");
            }

            return user;
        }

        private async Task UpdateLastLoginDate(ApplicationUser user)
        {
            user.LastLoginDate = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
        }

        private async Task<(string accessToken, string refreshToken)> GenerateAndStoreTokens(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var accessToken = _tokenService.GenerateJwtToken(user, roles.ToList());
            var refreshToken = _tokenService.GenerateRefreshToken(user);

            var refreshTokenEntity = new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
                ExpiredDate = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationDays),
            };

            await _tokenRepository.AddAsync(refreshTokenEntity);
            await _tokenRepository.SaveChangesAsync();

            return (accessToken, refreshToken);
        }

        private async Task<AuthResponseDto> CreateAuthResponse(ApplicationUser user, string accessToken, string refreshToken)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var userDto = _mapper.Map<UserDto>(user);
            userDto.Roles = roles.ToList();

            return new AuthResponseDto
            {
                Token = accessToken,
                RefreshToken = refreshToken,
                User = userDto
            };
        }

        private async Task<RefreshToken> ValidateRefreshToken(string token)
        {
            var refreshToken = await _tokenRepository.GetByTokenAsync(token);

            if (refreshToken == null || refreshToken.IsRevoked || refreshToken.ExpiredDate < DateTime.UtcNow)
            {
                throw new UnauthenticatedException("Invalid or expired refresh token.");
            }

            return refreshToken;
        }

        private async Task<ApplicationUser> GetActiveUser(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null || !user.IsActive)
            {
                throw new UnauthenticatedException("User not found or inactive.");
            }

            return user;
        }

        private async Task<ApplicationUser> GetUserById(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                throw new NotFoundException("User not found.");
            }
            return user;
        }

        private async Task<ApplicationUser> GetUserByEmail(string email)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                throw new NotFoundException("User not found.");
            }
            return user;
        }

        private async Task RevokeToken(string token)
        {
            await _tokenRepository.RevokeAsync(token);
            await _tokenRepository.SaveChangesAsync();
        }

        private async Task RevokeAllUserTokens(string userId)
        {
            await _tokenRepository.RevokeAllUserTokensAsync(userId);
            await _tokenRepository.SaveChangesAsync();
        }

        private async Task ResetUserPassword(ApplicationUser user, string token, string newPassword)
        {
            var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
            if (!result.Succeeded)
            {
                throw new BusinessException($"Password reset failed: {GetErrorMessages(result)}");
            }
        }

        private async Task ConfirmUserEmail(ApplicationUser user, string token)
        {
            var result = await _userManager.ConfirmEmailAsync(user, token);
            if (!result.Succeeded)
            {
                throw new BusinessException($"Email verification failed: {GetErrorMessages(result)}");
            }
        }

        private async Task SendEmailVerification(ApplicationUser user)
        {
            var emailToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var verificationLink = GenerateEmailVerificationLink(user.Email!, emailToken);

            var htmlContent = CreateEmailVerificationTemplate(user.FirstName, verificationLink);

            await _emailService.SendEmailAsync(
                user.Email!,
                "Verify Your Email Address",
                "Please verify your email by clicking the link.",
                htmlContent);
        }

        private async Task SendPasswordResetEmail(ApplicationUser user)
        {
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var resetLink = GeneratePasswordResetLink(user.Email!, resetToken);

            var htmlContent = CreatePasswordResetTemplate(user.FirstName, resetLink);

            await _emailService.SendEmailAsync(
                user.Email!,
                "Reset Your Password",
                "You have requested to reset your password. Please click the link to reset it.",
                htmlContent);
        }

        private string GenerateEmailVerificationLink(string email, string token)
        {
            var encodedEmail = Uri.EscapeDataString(email);
            var encodedToken = Uri.EscapeDataString(token);
            return $"{_frontendUrl}/auth/verify-email?email={encodedEmail}&token={encodedToken}";
        }

        private string GeneratePasswordResetLink(string email, string token)
        {
            var encodedEmail = Uri.EscapeDataString(email);
            var encodedToken = Uri.EscapeDataString(token);
            return $"{_frontendUrl}/auth/reset-password?email={encodedEmail}&token={encodedToken}";
        }

        private string CreateEmailVerificationTemplate(string firstName, string verificationLink)
        {
            return $@"
            <h2>Welcome {firstName}!</h2>
            <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
            <a href='{verificationLink}' style='display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;'>Verify Email</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>{verificationLink}</p>
            <p>This link will expire in 24 hours.</p>";
        }

        private string CreatePasswordResetTemplate(string firstName, string resetLink)
        {
            return $@"
            <h2>Password Reset Request</h2>
            <p>Hi {firstName},</p>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <a href='{resetLink}' style='display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;'>Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p>{resetLink}</p>
            <p>If you didn't request this, please ignore this email. This link will expire in 24 hours.</p>";
        }

        private string GetErrorMessages(IdentityResult result)
        {
            return string.Join(", ", result.Errors.Select(e => e.Description));
        }

        #endregion
    }
}