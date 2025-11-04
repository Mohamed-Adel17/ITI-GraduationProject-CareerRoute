using CareerRoute.API.Filters;
using CareerRoute.API.Models;
using CareerRoute.Core.Constants;
using CareerRoute.Core.DTOs.Users;
using CareerRoute.Core.Services.Implementations;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CareerRoute.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[AuthorizeRole(AppRoles.Admin)]
    public class UsersController : ControllerBase
    {
        private readonly IUserService userService;
        private readonly ILogger logger;


        public UsersController(IUserService userService, ILogger logger)
        {
            this.userService = userService;
            this.logger = logger;
        }

        public async Task<IActionResult> register(CreateUserDto cuDto)
        {
            logger.LogInformation("new user register with email" + cuDto.Email);

            var createdUser = await userService.CreateUserWithRoleAsync(cuDto);

            return StatusCode(201, new ApiResponse<RetriveUserDto>(
                createdUser,
                "user registered successfully"
            ));
        }

        public async Task<IActionResult> getMe()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier); //from JWT 

            logger.LogInformation($"user with Id {userId} requests his profile ");

            var user = await userService.GetUserByIdAsync(userId);

            return StatusCode(200, new ApiResponse<RetriveUserDto>(
            user,
            "user profile retrieved successfully"
            ));
        }

        public async Task<IActionResult> updateMe(UpdateUserDto uuDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier); //from JWT 

            logger.LogInformation($"user with Id {userId} requests updating his profile ");

            var user = await userService.UpdateUserByIdAsync(userId, uuDto);

            return StatusCode(200, new ApiResponse<RetriveUserDto>(
            user,
            "user profile updated successfully"
            ));
        }

        public async Task<IActionResult> deleteMe()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier); //from JWT 

            logger.LogInformation($"user with Id {userId} requests deleting his profile ");

            await userService.DeleteUserByIdAsync(userId);


            return StatusCode(204, new ApiResponse<RetriveUserDto>(
            null,
            "user profile deleted successfully"
            ));
        }

        public async Task<IActionResult> getAllUsers()
        {
            logger.LogInformation("admin request all users");

            var allUsers = await userService.GetAllUsersAsync();

            return StatusCode(200, new ApiResponse<IEnumerable<RetriveUserDto>>(
                 allUsers,
                 "all users retrieved successfully"
            ));
        }

    }
}
