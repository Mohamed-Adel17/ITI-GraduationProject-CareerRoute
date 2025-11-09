using CareerRoute.API.Models;
using CareerRoute.Core.DTOs.Mentors;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CareerRoute.API.Controllers
{
    /// <summary>
    /// Manages mentor profiles, applications, and approvals
    /// </summary>
    [Route("api/mentors")]
    [ApiController]
    [Produces("application/json")]
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

        /// <summary>
        /// Get all approved mentors (Public)
        /// </summary>
        /// <returns>List of all approved mentor profiles</returns>
        /// <response code="200">Returns list of approved mentors</response>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<MentorProfileDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetAllMentors()
        {
            var mentors = await _mentorService.GetAllApprovedMentorsAsync();
            return Ok(new ApiResponse<IEnumerable<MentorProfileDto>>(mentors));
        }

        /// <summary>
        /// Get mentor profile by ID (Public)
        /// </summary>
        /// <param name="id">Mentor ID</param>
        /// <returns>Detailed mentor profile information</returns>
        /// <response code="200">Returns the mentor profile</response>
        /// <response code="404">Mentor not found</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<MentorProfileDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetMentorById(string id)
        {
            var mentor = await _mentorService.GetMentorProfileAsync(id);
            return Ok(new ApiResponse<MentorProfileDto>(mentor));
        }

        /// <summary>
        /// Search mentors by keywords (Public)
        /// </summary>
        /// <param name="searchTerm">Search term to match against mentor names, bio, and expertise tags</param>
        /// <returns>List of mentors matching the search criteria</returns>
        /// <response code="200">Returns matching mentors (empty array if no matches)</response>
        [HttpGet("search")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<MentorProfileDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult> SearchMentors([FromQuery] string searchTerm)
        {
            var mentors = await _mentorService.SearchMentorsAsync(searchTerm);
            return Ok(new ApiResponse<IEnumerable<MentorProfileDto>>(mentors));
        }

        /// <summary>
        /// Get top-rated mentors (Public)
        /// </summary>
        /// <param name="count">Number of mentors to return (default: 10, max: 100)</param>
        /// <returns>List of highest-rated mentors</returns>
        /// <response code="200">Returns top-rated mentors</response>
        /// <response code="400">Invalid count parameter</response>
        [HttpGet("top-rated")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<MentorProfileDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
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

        /// <summary>
        /// Apply to become a mentor (Authenticated)
        /// </summary>
        /// <param name="createDto">Mentor application details</param>
        /// <returns>Created mentor profile (pending approval)</returns>
        /// <response code="201">Application submitted successfully</response>
        /// <response code="400">Invalid application data or user already has mentor profile</response>
        /// <response code="401">User not authenticated</response>
        /// <remarks>
        /// Users can only have one mentor profile. Application will be reviewed by admins.
        /// </remarks>
        [HttpPost]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<MentorProfileDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
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

            return CreatedAtAction(
                nameof(GetMentorById),
                new { id = createdMentor.Id },
                new ApiResponse<MentorProfileDto>(
                    createdMentor,
                    "Mentor application submitted successfully! Your application is pending approval."
                ));
        }

        /// <summary>
        /// Update mentor profile (Authenticated - Own profile or Admin)
        /// </summary>
        /// <param name="id">Mentor ID</param>
        /// <param name="updateDto">Mentor profile fields to update (all fields optional)</param>
        /// <returns>Updated mentor profile</returns>
        /// <response code="200">Profile updated successfully</response>
        /// <response code="400">Invalid update data</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User cannot update this mentor profile</response>
        /// <response code="404">Mentor not found</response>
        /// <remarks>
        /// All fields are optional. Mentors can update their own profiles. Admins can update any profile.
        /// </remarks>
        [HttpPatch("{id}")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<MentorProfileDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
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

        /// <summary>
        /// Get all pending mentor applications (Admin only)
        /// </summary>
        /// <returns>List of mentor applications awaiting approval</returns>
        /// <response code="200">Returns list of pending applications</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User doesn't have admin permissions</response>
        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<MentorProfileDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        public async Task<ActionResult> GetPendingMentors()
        {
            var mentors = await _mentorService.GetPendingMentorApplicationsAsync();
            return Ok(new ApiResponse<IEnumerable<MentorProfileDto>>(mentors));
        }

        /// <summary>
        /// Approve a mentor application (Admin only)
        /// </summary>
        /// <param name="id">Mentor ID to approve</param>
        /// <returns>Confirmation message</returns>
        /// <response code="200">Mentor approved successfully</response>
        /// <response code="400">Mentor already approved or invalid state</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User doesn't have admin permissions</response>
        /// <response code="404">Mentor not found</response>
        [HttpPatch("{id}/approve")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> ApproveMentor(string id)
        {
            await _mentorService.ApproveMentorAsync(id);

            return Ok(new ApiResponse { Message = "Mentor approved successfully" });
        }
        

        /// <summary>
        /// Reject a mentor application (Admin only)
        /// </summary>
        /// <param name="id">Mentor ID to reject</param>
        /// <param name="rejectDto">Rejection details including reason</param>
        /// <returns>Confirmation message</returns>
        /// <response code="200">Mentor application rejected</response>
        /// <response code="400">Invalid rejection data or mentor state</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User doesn't have admin permissions</response>
        /// <response code="404">Mentor not found</response>
        [HttpPatch("{id}/reject")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> RejectMentor(
            string id,
            [FromBody] RejectMentorDto rejectDto)
        {
            await _mentorService.RejectMentorAsync(id, rejectDto);

            return Ok(new ApiResponse { Message = "Mentor application rejected" });
        }
    }
}