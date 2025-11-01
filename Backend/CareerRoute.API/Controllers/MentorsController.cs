using CareerRoute.Core.DTOs.Mentors;
using CareerRoute.Core.Exceptions;
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
            _logger.LogInformation("GET /api/mentors - Fetching all approved mentors");

            var mentors = await _mentorService.GetAllApprovedMentorsAsync();

            return Ok(new
            {
                success = true,
                data = mentors
            });
        }

        // GET /api/mentors/{id} - Get specific mentor by ID (Public)
        [HttpGet("{id}")]
        public async Task<ActionResult> GetMentorById(string id)
        {
            _logger.LogInformation("GET /api/mentors/{Id}", id);

            var mentor = await _mentorService.GetMentorProfileAsync(id);

            if (mentor == null)
            {
                _logger.LogWarning("Mentor with ID {Id} not found", id);
                return NotFound(new
                {
                    success = false,
                    message = "Mentor not found",
                    statusCode = 404
                });
            }

            return Ok(new
            {
                success = true,
                data = mentor
            });
        }

        // GET /api/mentors/search - Search mentors by keywords (Public)
        [HttpGet("search")]
        public async Task<ActionResult> SearchMentors([FromQuery] string searchTerm)
        {
            _logger.LogInformation("GET /api/mentors/search?searchTerm={SearchTerm}", searchTerm);

            var mentors = await _mentorService.SearchMentorsAsync(searchTerm);

            return Ok(new
            {
                success = true,
                data = mentors
            });
        }

        // GET /api/mentors/top-rated - Get top-rated mentors (Public)
        [HttpGet("top-rated")]
        public async Task<ActionResult> GetTopRatedMentors([FromQuery] int count = 10)
        {
            _logger.LogInformation("GET /api/mentors/top-rated?count={Count}", count);

            if (count <= 0 || count > 100)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Count must be between 1 and 100",
                    statusCode = 400
                });
            }

            var mentors = await _mentorService.GetTopRatedMentorsAsync(count);

            return Ok(new
            {
                success = true,
                data = mentors
            });
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
                return Unauthorized(new
                {
                    success = false,
                    message = "Invalid authentication token",
                    statusCode = 401
                });
            }

            _logger.LogInformation("POST /api/mentors - User {UserId} applying as mentor", userId);

            try
            {
                var createdMentor = await _mentorService.CreateMentorProfileAsync(userId, createDto);

                _logger.LogInformation("Mentor profile created for user {UserId}", userId);

                // Return 201 with proper format
                return StatusCode(201, new
                {
                    success = true,
                    message = "Mentor application submitted successfully! Your application is pending approval.",
                    data = createdMentor
                });
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("already"))
            {
                // Return 409 Conflict for duplicate applications
                _logger.LogWarning("Duplicate mentor application: {Message}", ex.Message);
                return Conflict(new
                {
                    success = false,
                    message = "You have already applied to become a mentor. Your application is pending approval.",
                    statusCode = 409
                });
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning("Bad request: {Message}", ex.Message);
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message,
                    statusCode = 400
                });
            }
            catch (NotFoundException ex)
            {
                _logger.LogError("User not found: {Message}", ex.Message);
                return NotFound(new
                {
                    success = false,
                    message = ex.Message,
                    statusCode = 404
                });
            }
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
                return Unauthorized(new
                {
                    success = false,
                    message = "Invalid authentication token",
                    statusCode = 401
                });
            }

            // Allow admins to update any profile
            var isAdmin = User.IsInRole("Admin");
            if (userId != id && !isAdmin)
            {
                _logger.LogWarning("User {UserId} attempted to update mentor {MentorId}'s profile", userId, id);
                return StatusCode(403, new
                {
                    success = false,
                    message = "You can only update your own mentor profile",
                    statusCode = 403
                });
            }

            _logger.LogInformation("PUT /api/mentors/{Id}", id);

            try
            {
                var updatedMentor = await _mentorService.UpdateMentorProfileAsync(id, updateDto);

                _logger.LogInformation("Mentor profile updated successfully for ID: {Id}", id);

                return Ok(new
                {
                    success = true,
                    message = "Mentor profile updated successfully",
                    data = updatedMentor
                });
            }
            catch (NotFoundException ex)
            {
                _logger.LogError("Mentor not found: {Message}", ex.Message);
                return NotFound(new
                {
                    success = false,
                    message = ex.Message,
                    statusCode = 404
                });
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning("Validation error: {Message}", ex.Message);
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message,
                    statusCode = 400
                });
            }
        }

        // ============ ADMIN ENDPOINTS ============

        // GET /api/mentors/pending - Get pending applications
        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetPendingMentors()
        {
            _logger.LogInformation("GET /api/mentors/pending");

            var mentors = await _mentorService.GetPendingMentorApplicationsAsync();

            return Ok(new
            {
                success = true,
                data = mentors
            });
        }

        // PUT /api/mentors/{id}/approve - Approve mentor
        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> ApproveMentor(string id)
        {
            _logger.LogInformation("PUT /api/mentors/{Id}/approve", id);

            try
            {
                await _mentorService.ApproveMentorAsync(id);

                _logger.LogInformation("Mentor {Id} approved successfully", id);

                return Ok(new
                {
                    success = true,
                    message = "Mentor approved successfully"
                });
            }
            catch (NotFoundException ex)
            {
                _logger.LogError("Mentor not found: {Message}", ex.Message);
                return NotFound(new
                {
                    success = false,
                    message = ex.Message,
                    statusCode = 404
                });
            }
            catch (BusinessException ex)
            {
                _logger.LogWarning("Bad request: {Message}", ex.Message);
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message,
                    statusCode = 400
                });
            }
        }
        

        // PUT /api/mentors/{id}/reject - Reject mentor
        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> RejectMentor(
            string id,
            [FromBody] RejectMentorDto rejectDto)
        {
            _logger.LogInformation("PUT /api/mentors/{Id}/reject", id);

            if (string.IsNullOrWhiteSpace(rejectDto.Reason))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Rejection reason is required",
                    statusCode = 400
                });
            }

            try
            {
                await _mentorService.RejectMentorAsync(id, rejectDto.Reason);

                _logger.LogInformation("Mentor {Id} rejected successfully", id);

                return Ok(new
                {
                    success = true,
                    message = "Mentor rejected successfully"
                });
            }
            catch (NotFoundException ex)
            {
                _logger.LogError("Mentor not found: {Message}", ex.Message);
                return NotFound(new
                {
                    success = false,
                    message = ex.Message,
                    statusCode = 404
                });
            }
        }
    }
}