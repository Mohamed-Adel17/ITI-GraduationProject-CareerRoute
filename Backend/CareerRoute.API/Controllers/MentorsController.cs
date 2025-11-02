using CareerRoute.API.Models;
using CareerRoute.Core.DTOs.Mentors;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CareerRoute.API.Controllers
{
    [Route("api/mentors")]
    [ApiController]
    public class MentorsController : ControllerBase
    {
        private readonly IMentorService _mentorService;
        private readonly ILogger<MentorsController> _logger;

        public MentorsController(
            IMentorService mentorService,
            ILogger<MentorsController> logger)
        {
            _mentorService = mentorService;
            _logger = logger;
        }

        // ============ PUBLIC ENDPOINTS ============

        // GET /api/mentors - Get all approved mentors
        [HttpGet]
        public async Task<ActionResult> GetAllMentors()
        {
            var mentors = await _mentorService.GetAllApprovedMentorsAsync();
            return Ok(new ApiResponse<IEnumerable<MentorProfileDto>>(mentors));
        }

        // GET /api/mentors/{id} - Get specific mentor by ID (Public)
        [HttpGet("{id}")]
        public async Task<ActionResult> GetMentorById(string id)
        {
            var mentor = await _mentorService.GetMentorProfileAsync(id);
            return Ok(new ApiResponse<MentorProfileDto>(mentor));
        }

        // GET /api/mentors/search - Search mentors by keywords (Public)
        [HttpGet("search")]
        public async Task<ActionResult> SearchMentors([FromQuery] string searchTerm)
        {
            var mentors = await _mentorService.SearchMentorsAsync(searchTerm);
            return Ok(new ApiResponse<IEnumerable<MentorProfileDto>>(mentors));
        }

        // GET /api/mentors/top-rated - Get top-rated mentors (Public)
        [HttpGet("top-rated")]
        public async Task<ActionResult> GetTopRatedMentors([FromQuery] int count = 10)
        {
            if (count <= 0 || count > 100)
            {
                return BadRequest(ApiResponse.Error("Count must be between 1 and 100", 400));
            }

            var mentors = await _mentorService.GetTopRatedMentorsAsync(count);
            return Ok(new ApiResponse<IEnumerable<MentorProfileDto>>(mentors));
        }

        // ============ AUTHENTICATED ENDPOINTS ============

        // POST /api/mentors - Apply to become mentor
        [HttpPost]
        [Authorize]
        public async Task<ActionResult> ApplyAsMentor(
            [FromBody] CreateMentorProfileDto createDto) 
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse.Error("Invalid authentication token", 401));
            }

            _logger.LogInformation("User {UserId} submitted mentor application", userId);

            var createdMentor = await _mentorService.CreateMentorProfileAsync(userId, createDto);

            return StatusCode(201, new ApiResponse<MentorProfileDto>(
                createdMentor,
                "Mentor application submitted successfully! Your application is pending approval."
            ));
        }

        // PUT /api/mentors/{id} - Update mentor profile
        [HttpPut("{id}")]
        [Authorize]
        public async Task<ActionResult> UpdateMentorProfile(
            string id,
            [FromBody] UpdateMentorProfileDto updateDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse.Error("Invalid authentication token", 401));
            }

            // Allow admins to update any profile
            var isAdmin = User.IsInRole("Admin");
            if (userId != id && !isAdmin)
            {
                _logger.LogWarning("User {UserId} denied access to update mentor {MentorId} profile", userId, id);
                return StatusCode(403, ApiResponse.Error("You can only update your own mentor profile", 403));
            }

            var updatedMentor = await _mentorService.UpdateMentorProfileAsync(id, updateDto);

            return Ok(new ApiResponse<MentorProfileDto>(
                updatedMentor,
                "Mentor profile updated successfully"
            ));
        }

        // ============ ADMIN ENDPOINTS ============

        // GET /api/mentors/pending - Get pending applications
        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetPendingMentors()
        {
            var mentors = await _mentorService.GetPendingMentorApplicationsAsync();
            return Ok(new ApiResponse<IEnumerable<MentorProfileDto>>(mentors));
        }

        // PUT /api/mentors/{id}/approve - Approve mentor
        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> ApproveMentor(string id)
        {
            await _mentorService.ApproveMentorAsync(id);

            return Ok(new ApiResponse { Message = "Mentor approved successfully" });
        }
        

        // PUT /api/mentors/{id}/reject - Reject mentor
        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> RejectMentor(
            string id,
            [FromBody] RejectMentorDto rejectDto)
        {
            await _mentorService.RejectMentorAsync(id, rejectDto.Reason);

            return Ok(new ApiResponse { Message = "Mentor application rejected" });
        }
    }
}