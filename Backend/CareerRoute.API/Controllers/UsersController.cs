using CareerRoute.API.Filters;
using CareerRoute.API.Models;
using CareerRoute.Core.Constants;
using CareerRoute.Core.DTOs.Users;
using CareerRoute.Core.Services.Implementations;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace CareerRoute.API.Controllers
{
    /// <summary>
    /// Manages user profiles and account operations
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    //[AuthorizeRole(AppRoles.Admin)]
    public class UsersController : ControllerBase
    {
        private readonly IUserService userService;
        private readonly ILogger<UsersController> logger;


        public UsersController(IUserService userService, ILogger<UsersController> logger)
        {
            this.userService = userService;
            this.logger = logger;
        }



        /// <summary>
        /// Get current authenticated user's profile
        /// </summary>
        /// <returns>Current user's profile information</returns>
        /// <response code="200">Returns the user's profile</response>
        /// <response code="401">User not authenticated</response>
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<RetrieveUserDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMe()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                return Unauthorized(ApiResponse.Error("Unauthorized access", 401));

            logger.LogInformation($"user with Id {userId} requests his profile");

            var user = await userService.GetUserByIdAsync(userId);

            return Ok(new ApiResponse<RetrieveUserDto>(
                user,
                "User profile retrieved successfully"
            ));
        }




        /// <summary>
        /// Update current authenticated user's profile
        /// </summary>
        /// <param name="uuDto">User profile fields to update (all fields optional)</param>
        /// <returns>Updated user profile</returns>
        /// <response code="200">Profile updated successfully</response>
        /// <response code="400">Invalid input data</response>
        /// <response code="401">User not authenticated</response>
        /// <remarks>
        /// Sample request:
        /// 
        ///     PATCH /api/users/me
        ///     {
        ///         "firstName": "John",
        ///         "lastName": "Doe",
        ///         "phoneNumber": "+1234567890",
        ///         "careerGoal": "Software Engineer",
        ///         "careerInterest": "Full Stack Development"
        ///     }
        /// 
        /// Note: All fields are optional. Only provide fields you want to update.
        /// </remarks>
        [HttpPatch("me")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<RetrieveUserDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> UpdateMe([FromBody] UpdateUserDto uuDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                return Unauthorized(ApiResponse.Error("Unauthorized access", 401));

            logger.LogInformation($"User with Id {userId} requests updating their profile");

            var user = await userService.UpdateUserByIdAsync(userId, uuDto);

            return Ok(new ApiResponse<RetrieveUserDto>(
                user,
                "User profile updated successfully"
            ));
        }




        /// <summary>
        /// Delete current authenticated user's account
        /// </summary>
        /// <returns>Confirmation message</returns>
        /// <response code="200">Account deleted successfully</response>
        /// <response code="401">User not authenticated</response>
        /// <remarks>
        /// Warning: This action is irreversible and will permanently delete the user account and all associated data.
        /// </remarks>
        [HttpDelete("me")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> DeleteMe()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                return Unauthorized(ApiResponse.Error("Unauthorized access", 401));

            logger.LogInformation($"user with Id {userId} requests deleting his profile");

            await userService.DeleteUserByIdAsync(userId);

            return Ok(new ApiResponse { Message = "User profile deleted successfully" });
        }


        /// <summary>
        /// Get all users (Admin and Mentor only)
        /// </summary>
        /// <returns>List of all users in the system</returns>
        /// <response code="200">Returns list of users</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User doesn't have required permissions</response>
        /// <response code="404">No users found</response>
        [HttpGet]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Mentor}")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<RetrieveUserDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> getAllUsers()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                return Unauthorized(ApiResponse.Error("Unauthorized access", 401));

            logger.LogInformation($"User with Id {userId} requested all users");

            var allUsers = await userService.GetAllUsersAsync();

            if (allUsers == null || !allUsers.Any())
                return NotFound(ApiResponse.Error("No users found", 404));

            return Ok(new ApiResponse<IEnumerable<RetrieveUserDto>>(
                allUsers,
                "All users retrieved successfully"
            ));
        }


        /// <summary>
        /// Get user by ID (Admin and Mentor only)
        /// </summary>
        /// <param name="id">User ID</param>
        /// <returns>User profile information</returns>
        /// <response code="200">Returns the user profile</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User doesn't have required permissions</response>
        /// <response code="404">User not found</response>
        [HttpGet("{id}")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Mentor}")]
        [ProducesResponseType(typeof(ApiResponse<RetrieveUserDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUserById(string id)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized(ApiResponse.Error("Unauthorized access", 401));

            logger.LogInformation($"Admin/Mentor (Id: {currentUserId}) requested user with Id {id}.");

            var user = await userService.GetUserByIdAsync(id);

            return Ok(new ApiResponse<RetrieveUserDto>(
                user,
                "User retrieved successfully."
            ));
        }

        /// <summary>
        /// Update user profile by ID (Admin only)
        /// </summary>
        /// <param name="id">User ID to update</param>
        /// <param name="dto">User profile fields to update (all fields optional)</param>
        /// <returns>Updated user profile</returns>
        /// <response code="200">Profile updated successfully</response>
        /// <response code="400">Invalid input data</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User doesn't have admin permissions</response>
        /// <response code="404">User not found</response>
        /// <remarks>
        /// Sample request:
        /// 
        ///     PATCH /api/users/{id}
        ///     {
        ///         "firstName": "John",
        ///         "lastName": "Doe",
        ///         "careerGoal": "Data Scientist"
        ///     }
        /// 
        /// Note: All fields are optional. Only provide fields you want to update.
        /// </remarks>
        [HttpPatch("{id}")]
        [Authorize(Roles = AppRoles.Admin)]
        [ProducesResponseType(typeof(ApiResponse<RetrieveUserDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateUserByAdmin(string id, [FromBody] UpdateUserDto dto)
        {
            var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(adminId))
                return Unauthorized(ApiResponse.Error("Unauthorized access", 401));

            logger.LogInformation($"Admin (Id: {adminId}) requested to update user with Id {id}.");

            var user = await userService.UpdateUserByIdAsync(id, dto);

            return Ok(new ApiResponse<RetrieveUserDto>(
                user,
                $"User profile with Id {id} updated successfully."
            ));
        }



    }
}
