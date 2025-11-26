using CareerRoute.API.Models;
using CareerRoute.Core.DTOs.Auth;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;

namespace CareerRoute.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    [Produces("application/json")]
    public class AuthenticationController : ControllerBase
    {
        private readonly IAuthenticationService _authenticationService;

        public AuthenticationController(
            IAuthenticationService authenticationService)
        {
            _authenticationService = authenticationService;
        }

        /// <summary>
        /// Register a new user account
        /// </summary>
        /// <param name="registerRequest">Registration details</param>
        /// <returns>Registration response with user ID and confirmation message</returns>
        /// <response code="200">Registration successful</response>
        /// <response code="400">Invalid input or user already exists</response>
        [HttpPost("register")]
        [EnableRateLimiting(RateLimitingPolicies.Auth)]
        [ProducesResponseType(typeof(ApiResponse<RegisterResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto registerRequest)
        {
            var response = await _authenticationService.Register(registerRequest);
            return Ok(new ApiResponse<RegisterResponseDto>(response));
        }

        /// <summary>
        /// Login with email and password
        /// </summary>
        /// <param name="loginRequest">Login credentials</param>
        /// <returns>JWT access token, refresh token, and user information</returns>
        /// <response code="200">Login successful</response>
        /// <response code="401">Invalid credentials or account issues</response>
        [HttpPost("login")]
        [EnableRateLimiting(RateLimitingPolicies.Auth)]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto loginRequest)
        {
            var response = await _authenticationService.Login(loginRequest);
            return Ok(new ApiResponse<AuthResponseDto>(response));
        }

        /// <summary>
        /// Refresh access token using refresh token
        /// </summary>
        /// <param name="tokenRequest">Refresh token</param>
        /// <returns>New JWT access token and refresh token</returns>
        /// <response code="200">Token refresh successful</response>
        /// <response code="401">Invalid or expired refresh token</response>
        [HttpPost("refresh")]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> RefreshToken([FromBody] TokenRequestDto tokenRequest)
        {
            var response = await _authenticationService.RefreshToken(tokenRequest);
            return Ok(new ApiResponse<AuthResponseDto>(response));
        }

        /// <summary>
        /// Verify email address with token
        /// </summary>
        /// <param name="verifyRequest">Email and verification token</param>
        /// <returns>JWT tokens and user information after successful verification</returns>
        /// <response code="200">Email verified successfully</response>
        /// <response code="400">Invalid token or email already verified</response>
        [HttpPost("verify-email")]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequestDto verifyRequest)
        {

            var response = await _authenticationService.VerifyEmail(verifyRequest);
            return Ok(new ApiResponse<AuthResponseDto>(response));

        }

        /// <summary>
        /// Request a new email verification link
        /// </summary>
        /// <param name="emailRequest">User email</param>
        /// <returns>Confirmation message</returns>
        /// <response code="200">Verification email sent</response>
        /// <response code="400">Email already verified or invalid</response>
        [HttpPost("resend-verification")]
        [EnableRateLimiting(RateLimitingPolicies.Auth)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> RequestVerifyEmail([FromBody] EmailRequestDto emailRequest)
        {
            await _authenticationService.RequestVerifyEmail(emailRequest);
            return Ok(new ApiResponse { Message = "Verification email sent. Please check your inbox." });
        }

        /// <summary>
        /// Request password reset email
        /// </summary>
        /// <param name="emailRequest">User email</param>
        /// <returns>Confirmation message</returns>
        /// <response code="200">Password reset email sent</response>
        /// <response code="400">Invalid request</response>
        [HttpPost("forgot-password")]
        [EnableRateLimiting(RateLimitingPolicies.ForgetPassword)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ForgotPassword([FromBody] EmailRequestDto emailRequest)
        {

            await _authenticationService.ForgotPassword(emailRequest);
            // Always return success to prevent email enumeration
            return Ok(new ApiResponse { Message = "If an account exists with this email, a password reset link has been sent." });
        }

        /// <summary>
        /// Reset password with token
        /// </summary>
        /// <param name="resetPasswordRequest">Reset password details including token</param>
        /// <returns>JWT tokens and user information after successful reset</returns>
        /// <response code="200">Password reset successful</response>
        /// <response code="400">Invalid token or password</response>
        [HttpPost("reset-password")]
        [EnableRateLimiting(RateLimitingPolicies.PasswordReset)]
        [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto resetPasswordRequest)
        {
            var response = await _authenticationService.ResetPassword(resetPasswordRequest);
            return Ok(new ApiResponse<AuthResponseDto>(response));

        }

        /// <summary>
        /// Change password for authenticated user
        /// </summary>
        /// <param name="changePasswordRequest">Current and new password</param>
        /// <returns>Confirmation message</returns>
        /// <response code="200">Password changed successfully</response>
        /// <response code="400">Invalid current password or validation error</response>
        /// <response code="401">User not authenticated</response>
        [HttpPost("change-password")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto changePasswordRequest)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            await _authenticationService.ChangePassword(userId, changePasswordRequest);
            return Ok(new ApiResponse { Message = "Password changed successfully. Please login again with your new password." });

        }

        /// <summary>
        /// Logout current user and revoke all refresh tokens
        /// </summary>
        /// <returns>Confirmation message</returns>
        /// <response code="200">Logout successful</response>
        /// <response code="401">User not authenticated</response>
        [HttpPost("logout")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Logout()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            await _authenticationService.Logout(userId);
            return Ok(new ApiResponse { Message = "Logged out successfully" });
        }

    }
}