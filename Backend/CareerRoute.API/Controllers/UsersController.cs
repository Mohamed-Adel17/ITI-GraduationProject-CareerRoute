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
    [Route("api/[controller]")]
    [ApiController]
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



        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> getMe()
        {

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier); //from JWT 

            if (string.IsNullOrEmpty(userId))
                return StatusCode(401, ApiResponse.Error("Unauthorized access", 401));

            logger.LogInformation($"user with Id {userId} requests his profile ");

            try
            {
                var user = await userService.GetUserByIdAsync(userId);

                return StatusCode(200, new ApiResponse<RetriveUserDto>(
                    user,
                    "User profile retrieved successfully"
                ));
            }
            catch (KeyNotFoundException)
            {
                return StatusCode(404, ApiResponse.Error("User not found", 404));
            }

        }




        [HttpPut("me")]
        [Authorize]
        public async Task<IActionResult> updateMe([FromBody] UpdateUserDto uuDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier); // from JWT
            if (string.IsNullOrEmpty(userId))
                return StatusCode(401, ApiResponse.Error("Unauthorized access", 401));

            logger.LogInformation($"User with Id {userId} requests updating their profile");

            try
            {
                var user = await userService.UpdateUserByIdAsync(userId, uuDto);

                return StatusCode(200, new ApiResponse<RetriveUserDto>(
                    user,
                    "User profile updated successfully"
                ));
            }
            catch (KeyNotFoundException)
            {
                return StatusCode(404, ApiResponse.Error("User not found", 404));
            }

            catch (FluentValidation.ValidationException ex)
            {
                var errorDict = ex.Errors?
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray())
                    ?? new Dictionary<string, string[]>();

                return StatusCode(400, ApiResponse.Error("Validation failed", 400, errorDict));

            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, 500));

            }
        }




        [HttpDelete("me")]
        [Authorize]
        public async Task<IActionResult> deleteMe()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier); //from JWT 

            if (string.IsNullOrEmpty(userId))
                return StatusCode(401, ApiResponse.Error("Unauthorized access", 401));

            logger.LogInformation($"user with Id {userId} requests deleting his profile ");

            try
            {
                await userService.DeleteUserByIdAsync(userId);


                return StatusCode(200, new ApiResponse<RetriveUserDto>(
                null,
                "user profile deleted successfully"
                ));
            }
            catch (KeyNotFoundException)
            {
                return StatusCode(404, ApiResponse.Error("User not found", 404));
            }

            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse.Error(ex.Message, 500));

            }
        }


        [HttpGet]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Mentor}")]
        public async Task<IActionResult> getAllUsers()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                return StatusCode(401, ApiResponse.Error("Unauthorized access", 401));

            logger.LogInformation($"User with Id {userId} requested all users");

            try
            {
                var allUsers = await userService.GetAllUsersAsync();

                if (allUsers == null || !allUsers.Any())
                    return StatusCode(404, ApiResponse.Error("No users found", 404));

                return StatusCode(200, new ApiResponse<IEnumerable<RetriveUserDto>>(
                    allUsers,
                    "All users retrieved successfully"
                ));
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(403, ApiResponse.Error("You are not allowed to view all users", 403));
            }
        }


        [HttpGet("{id}")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Mentor}")]
        public async Task<IActionResult> GetUserById(string id)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(currentUserId))
                return StatusCode(401, ApiResponse.Error("Unauthorized access", 401));

            logger.LogInformation($"Admin/Mentor (Id: {currentUserId}) requested user with Id {id}.");

            try
            {
                var user = await userService.GetUserByIdAsync(id);

                return StatusCode(200, new ApiResponse<RetriveUserDto>(
                    user,
                    "User retrieved successfully."
                ));
            }
            catch (KeyNotFoundException)
            {
                return StatusCode(404, ApiResponse.Error("User not found", 404));
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(403, ApiResponse.Error("You can only view your own profile", 403));
            }

        }

        [HttpPut("{id}")]
        [Authorize(Roles = AppRoles.Admin)]
        public async Task<IActionResult> UpdateUserByAdmin(string id, [FromBody] UpdateUserDto dto)
        {
            var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(adminId))
                return StatusCode(401, ApiResponse.Error("Unauthorized access", 401));

            logger.LogInformation($"Admin (Id: {adminId}) requested to update user with Id {id}.");

            try
            {
                var user = await userService.UpdateUserByIdAsync(id, dto);

                return StatusCode(200, new ApiResponse<RetriveUserDto>(
                    user,
                    $"User profile with Id {id} updated successfully."
                ));
            }
            catch (KeyNotFoundException)
            {
                return StatusCode(404, ApiResponse.Error("User not found", 404));
            }
            catch (FluentValidation.ValidationException ex)
            {
                var errorDict = ex.Errors?
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray())
                    ?? new Dictionary<string, string[]>();

                return StatusCode(400, ApiResponse.Error("Validation failed", 400, errorDict));
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(403, ApiResponse.Error("You are not allowed to update this user", 403));
            }

        }



    }
}
