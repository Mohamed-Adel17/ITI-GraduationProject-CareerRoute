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




        [HttpPatch("me")]
        [Authorize]
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




        [HttpDelete("me")]
        [Authorize]
        public async Task<IActionResult> DeleteMe()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                return Unauthorized(ApiResponse.Error("Unauthorized access", 401));

            logger.LogInformation($"user with Id {userId} requests deleting his profile");

            await userService.DeleteUserByIdAsync(userId);

            return Ok(new ApiResponse { Message = "User profile deleted successfully" });
        }


        [HttpGet]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Mentor}")]
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


        [HttpGet("{id}")]
        [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Mentor}")]
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

        [HttpPatch("{id}")]
        [Authorize(Roles = AppRoles.Admin)]
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
