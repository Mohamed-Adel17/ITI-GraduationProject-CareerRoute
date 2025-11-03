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
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

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
        private readonly IOptions<JwtSettings> _jwtSettings;
        private readonly IConfiguration _configuration;
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
            _jwtSettings = jwtSettings;
            _configuration = configuration;
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
            // Validate request
            await _registerValidator.ValidateAndThrowAsync(registerRequest);

            // Check if user already exists
            var existingUser = await _userManager.FindByEmailAsync(registerRequest.Email);
            if (existingUser != null)
            {
                throw new BusinessException("User with this email already exists.");
            }

            // Create new user
            var user = new ApplicationUser
            {
                UserName = registerRequest.Email,
                Email = registerRequest.Email,
                FirstName = registerRequest.FirstName,
                LastName = registerRequest.LastName,
                PhoneNumber = registerRequest.PhoneNumber,
                EmailConfirmed = false,
                RegistrationDate = DateTime.UtcNow,
                IsActive = true
            };

            var result = await _userManager.CreateAsync(user, registerRequest.Password);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new BusinessException($"Failed to create user: {errors}");
            }

            // Assign role based on registration type
            var roleName = registerRequest.RegisterAsMentor ? AppRoles.Mentor : AppRoles.User;
            await _userManager.AddToRoleAsync(user, roleName);

            // Generate email verification token
            var emailToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);

            // Create verification link
            var verificationLink = GenerateEmailVerificationLink(user.Email, emailToken);

            // Send verification email
            var subject = "Verify Your Email Address";
            var body = $"Please verify your email by clicking the link.";
            var htmlContent = $@"
        <h2>Welcome {user.FirstName}!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <a href='{verificationLink}' style='display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;'>Verify Email</a>
        <p>Or copy and paste this link into your browser:</p>
        <p>{verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
    ";

            await _emailService.SendEmailAsync(user.Email, subject, body, htmlContent);

            return new RegisterResponseDto
            {
                UserId = user.Id,
                Email = user.Email,
                Message = "Registration successful. Please check your email to verify your account."
            };
        }

        public async Task<AuthResponseDto> Login(LoginRequestDto loginRequest)
        {
            // Validate request
            await _loginValidator.ValidateAndThrowAsync(loginRequest);

            var user = await _userManager.FindByEmailAsync(loginRequest.Email);

            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid email or password.");
            }

            if (!user.IsActive)
            {
                throw new UnauthorizedAccessException("Account is deactivated.");
            }

            if (!user.EmailConfirmed)
            {
                throw new UnauthorizedAccessException("Please verify your email before logging in.");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, loginRequest.Password, lockoutOnFailure: true);

            if (!result.Succeeded)
            {
                if (result.IsLockedOut)
                {
                    throw new UnauthorizedAccessException("Account is locked due to multiple failed login attempts.");
                }
                throw new UnauthorizedAccessException("Invalid email or password.");
            }

            // Update last login date
            user.LastLoginDate = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            // Generate tokens
            var roles = await _userManager.GetRolesAsync(user);
            var accessToken = _tokenService.GenerateJwtToken(user, roles.ToList());
            var refreshToken = _tokenService.GenerateRefreshToken(user);

            // Store refresh token using repository
            var refreshTokenEntity = new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
                ExpiredDate = DateTime.UtcNow.AddDays(_jwtSettings.Value.RefreshTokenExpirationDays),
            };

            await _tokenRepository.AddAsync(refreshTokenEntity);
            await _tokenRepository.SaveChangesAsync();

            var userDto = _mapper.Map<UserDto>(user);
            userDto.Roles = roles.ToList();
            userDto.IsMentor = roles.Contains(AppRoles.Mentor);

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = userDto
            };
        }

        public async Task<AuthResponseDto> RefreshToken(TokenRequestDto tokenRequest)
        {
            // Validate request
            await _tokenValidator.ValidateAndThrowAsync(tokenRequest);

            var refreshToken = await _tokenRepository.GetByTokenAsync(tokenRequest.RefreshToken);

            if (refreshToken == null || refreshToken.IsRevoked || refreshToken.ExpiredDate < DateTime.UtcNow)
            {
                throw new UnauthorizedAccessException("Invalid or expired refresh token.");
            }

            var user = await _userManager.FindByIdAsync(refreshToken.UserId);

            if (user == null || !user.IsActive)
            {
                throw new UnauthorizedAccessException("User not found or inactive.");
            }

            // Revoke old refresh token
            await _tokenRepository.RevokeAsync(refreshToken.Token);
            await _tokenRepository.SaveChangesAsync();

            // Generate new tokens
            var roles = await _userManager.GetRolesAsync(user);
            var newAccessToken = _tokenService.GenerateJwtToken(user, roles.ToList());
            var newRefreshToken = _tokenService.GenerateRefreshToken(user);

            // Store new refresh token
            var newRefreshTokenEntity = new RefreshToken
            {
                Token = newRefreshToken,
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
                ExpiredDate = DateTime.UtcNow.AddDays(_jwtSettings.Value.RefreshTokenExpirationDays),
            };

            await _tokenRepository.AddAsync(newRefreshTokenEntity);
            await _tokenRepository.SaveChangesAsync();

            var userDto = _mapper.Map<UserDto>(user);
            userDto.Roles = roles.ToList();
            userDto.IsMentor = roles.Contains(AppRoles.Mentor);

            return new AuthResponseDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                User = userDto
            };
        }

        public async Task ForgotPassword(EmailRequestDto emailRequest)
        {
            // Validate request
            await _emailValidator.ValidateAndThrowAsync(emailRequest);

            var user = await _userManager.FindByEmailAsync(emailRequest.Email);

            if (user == null)
            {
                // Don't reveal that the user doesn't exist for security reasons
                return;
            }

            if (!user.EmailConfirmed)
            {
                throw new BusinessException("Please verify your email first.");
            }

            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);

            // Create password reset link
            var resetLink = GeneratePasswordResetLink(user.Email!, resetToken);

            // Send password reset email
            var subject = "Reset Your Password";
            var body = $"You have requested to reset your password. Please click the link to reset it.";
            var htmlContent = $@"
        <h2>Password Reset Request</h2>
        <p>Hi {user.FirstName},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <a href='{resetLink}' style='display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;'>Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p>{resetLink}</p>
        <p>If you didn't request this, please ignore this email. This link will expire in 24 hours.</p>
    ";

            await _emailService.SendEmailAsync(user.Email!, subject, body, htmlContent);
        }

        public async Task<AuthResponseDto> ResetPassword(ResetPasswordRequestDto resetPasswordRequest)
        {
            // Validate request
            await _resetPasswordValidator.ValidateAndThrowAsync(resetPasswordRequest);

            var user = await _userManager.FindByEmailAsync(resetPasswordRequest.Email);

            if (user == null)
            {
                throw new NotFoundException("User not found.");
            }

            var result = await _userManager.ResetPasswordAsync(user, resetPasswordRequest.Token, resetPasswordRequest.NewPassword);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new BusinessException($"Password reset failed: {errors}");
            }

            // Revoke all existing refresh tokens for security
            await _tokenRepository.RevokeAllUserTokensAsync(user.Id);
            await _tokenRepository.SaveChangesAsync();

            // Generate new tokens for auto-login
            var roles = await _userManager.GetRolesAsync(user);
            var accessToken = _tokenService.GenerateJwtToken(user, roles.ToList());
            var refreshToken = _tokenService.GenerateRefreshToken(user);

            var refreshTokenEntity = new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
                ExpiredDate = DateTime.UtcNow.AddDays(_jwtSettings.Value.RefreshTokenExpirationDays),
            };

            await _tokenRepository.AddAsync(refreshTokenEntity);
            await _tokenRepository.SaveChangesAsync();

            var userDto = _mapper.Map<UserDto>(user);
            userDto.Roles = roles.ToList();
            userDto.IsMentor = roles.Contains(AppRoles.Mentor);

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = userDto
            };
        }

        public async Task ChangePassword(string userId, ChangePasswordRequestDto changePasswordRequest)
        {
            // Validate request
            await _changePasswordValidator.ValidateAndThrowAsync(changePasswordRequest);

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                throw new NotFoundException("User not found.");
            }

            var result = await _userManager.ChangePasswordAsync(
                user,
                changePasswordRequest.CurrentPassword,
                changePasswordRequest.NewPassword
            );

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new BusinessException($"Password change failed: {errors}");
            }

            // Revoke all refresh tokens for security
            await _tokenRepository.RevokeAllUserTokensAsync(user.Id);
            await _tokenRepository.SaveChangesAsync();
        }

        public async Task Logout(string userId)
        {
            // Revoke all active refresh tokens for the user
            await _tokenRepository.RevokeAllUserTokensAsync(userId);
            await _tokenRepository.SaveChangesAsync();

            // Sign out from Identity
            await _signInManager.SignOutAsync();
        }

        public async Task RequestVerifyEmail(EmailRequestDto emailRequest)
        {
            // Validate request
            await _emailValidator.ValidateAndThrowAsync(emailRequest);

            var user = await _userManager.FindByEmailAsync(emailRequest.Email);

            if (user == null)
            {
                throw new NotFoundException("User not found.");
            }

            if (user.EmailConfirmed)
            {
                throw new BusinessException("Email is already verified.");
            }

            // Generate new email verification token
            var emailToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);

            // Create verification link
            var verificationLink = GenerateEmailVerificationLink(user.Email!, emailToken);

            // Send verification email
            var subject = "Verify Your Email Address";
            var body = $"Please verify your email by clicking the link.";
            var htmlContent = $@"
        <h2>Email Verification</h2>
        <p>Hi {user.FirstName},</p>
        <p>Please verify your email address by clicking the button below:</p>
        <a href='{verificationLink}' style='display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;'>Verify Email</a>
        <p>Or copy and paste this link into your browser:</p>
        <p>{verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
    ";

            await _emailService.SendEmailAsync(user.Email!, subject, body, htmlContent);
        }

        public async Task<AuthResponseDto> VerifyEmail(VerifyEmailRequestDto verifyEmailRequest)
        {
            // Validate request
            await _verifyEmailValidator.ValidateAndThrowAsync(verifyEmailRequest);

            var user = await _userManager.FindByEmailAsync(verifyEmailRequest.Email);

            if (user == null)
            {
                throw new NotFoundException("User not found.");
            }

            if (user.EmailConfirmed)
            {
                throw new BusinessException("Email is already verified.");
            }

            var result = await _userManager.ConfirmEmailAsync(user, verifyEmailRequest.Token);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new BusinessException($"Email verification failed: {errors}");
            }

            // Generate tokens for auto-login after verification
            var roles = await _userManager.GetRolesAsync(user);
            var accessToken = _tokenService.GenerateJwtToken(user, roles.ToList());
            var refreshToken = _tokenService.GenerateRefreshToken(user);

            var refreshTokenEntity = new RefreshToken
            {
                Token = refreshToken,
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
                ExpiredDate = DateTime.UtcNow.AddDays(_jwtSettings.Value.RefreshTokenExpirationDays),
            };

            await _tokenRepository.AddAsync(refreshTokenEntity);
            await _tokenRepository.SaveChangesAsync();

            var userDto = _mapper.Map<UserDto>(user);
            userDto.Roles = roles.ToList();
            userDto.IsMentor = roles.Contains(AppRoles.Mentor);

            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = userDto
            };
        }

        private string GenerateEmailVerificationLink(string email, string token)
        {
            var encodedEmail = Uri.EscapeDataString(email);
            var encodedToken = Uri.EscapeDataString(token);
            var baseUrl = _configuration["FrontendUrl"] ?? "https://localhost:4200";
            return $"{baseUrl}/api/auth/verify-email?email={encodedEmail}&token={encodedToken}";
        }

        private string GeneratePasswordResetLink(string email, string token)
        {
            var encodedEmail = Uri.EscapeDataString(email);
            var encodedToken = Uri.EscapeDataString(token);
            var baseUrl = _configuration["FrontendUrl"] ?? "https://localhost:4200";
            return $"{baseUrl}/api/auth/reset-password?email={encodedEmail}&token={encodedToken}";
        }
    }
}