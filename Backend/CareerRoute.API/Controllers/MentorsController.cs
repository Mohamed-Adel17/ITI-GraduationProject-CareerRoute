using CareerRoute.API.Models;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.DTOs.Mentors;
using CareerRoute.Core.DTOs.Reviews;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
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
        private readonly IReviewService _reviewService;
        private readonly ILogger<MentorsController> _logger;

        public MentorsController(
            IMentorService mentorService,
            IReviewService reviewService,
            ILogger<MentorsController> logger)
        {
            _mentorService = mentorService;
            _reviewService = reviewService;
            _logger = logger;
        }

        // ============ PUBLIC ENDPOINTS ============

        /// <summary>
        /// Search and filter mentors with advanced filtering, sorting, and pagination (Public)
        /// </summary>
        /// <remarks>
        /// **Search &amp; Filter Options:**
        /// 
        /// - **keywords**: Search in mentor name, bio, certifications, and skills (min 2 characters)
        /// - **categoryId**: Filter by category (IT Careers, Leadership, Finance, etc.)
        /// - **minPrice/maxPrice**: Filter by 30-minute session price range
        /// - **minRating**: Filter by minimum average rating (0-5)
        /// 
        /// **Sorting Options:**
        /// 
        /// - **popularity** (default): Most sessions completed
        /// - **rating**: Highest rated mentors
        /// - **priceAsc**: Lowest price first
        /// - **priceDesc**: Highest price first
        /// - **experience**: Most years of experience
        /// 
        /// **Pagination:**
        /// 
        /// - **page**: Page number (default: 1)
        /// - **pageSize**: Items per page (1-50, default: 12)
        /// 
        /// **Response Format:**
        /// 
        /// - Returns simple array if no filters applied
        /// - Returns paginated response with metadata if any filters/pagination provided
        /// 
        /// **Example Queries:**
        /// 
        /// - `/api/mentors?keywords=React&amp;sortBy=rating`
        /// - `/api/mentors?categoryId=2&amp;minPrice=20&amp;maxPrice=50`
        /// - `/api/mentors?minRating=4.5&amp;sortBy=experience&amp;page=2`
        /// </remarks>
        /// <param name="request">Search and filter parameters</param>
        /// <returns>List of mentors or paginated search results</returns>
        /// <response code="200">Returns mentors (array or paginated response)</response>
        /// <response code="400">Invalid search parameters</response>
        /// <response code="404">No mentors found matching criteria</response>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<MentorProfileDto>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<MentorSearchResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetAllMentors([FromQuery] MentorSearchRequestDto request)
        {
            var hasQueryParams = Request.Query.Count > 0;
            var isDefaultRequest = string.IsNullOrWhiteSpace(request.Keywords)
                                   && !request.CategoryId.HasValue
                                   && !request.MinPrice.HasValue
                                   && !request.MaxPrice.HasValue
                                   && !request.MinRating.HasValue
                                   && request.Page == 1
                                   && request.PageSize == 12
                                   && (string.IsNullOrWhiteSpace(request.SortBy) ||
                                       string.Equals(request.SortBy, "popularity", StringComparison.OrdinalIgnoreCase));

            var useAdvancedSearch = hasQueryParams || !isDefaultRequest;

            if (!useAdvancedSearch)
            {
                var mentors = (await _mentorService.GetAllApprovedMentorsAsync()).ToList();

                if (!mentors.Any())
                {
                    return NotFound(ApiResponse.Error("No mentors found", 404));
                }

                return Ok(new ApiResponse<IEnumerable<MentorProfileDto>>(
                    mentors,
                    "Mentors retrieved successfully"));
            }

            var result = await _mentorService.SearchMentorsAsync(request);

            if (result.Mentors.Count == 0)
            {
                return NotFound(ApiResponse.Error("No mentors found matching your criteria", 404));
            }

            var responseMessage = string.IsNullOrWhiteSpace(request.Keywords)
                ? "Mentors retrieved successfully"
                : "Search completed successfully";

            return Ok(new ApiResponse<MentorSearchResponseDto>(result, responseMessage));
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



        /// <summary>
        /// Retrieve paginated reviews for a specific mentor(public)
        /// </summary>
        /// <remarks>
        /// Returns a list of reviews submitted for the mentor, including rating, comment, 
        /// creation date, and the mentor's name. Supports pagination through query parameters.
        ///
        /// <b>Pagination:</b><br/>
        /// - <c>page</c>: Current page number (default 1)<br/>
        /// - <c>pageSize</c>: Number of reviews per page (default 10)<br/>
        ///
        /// <b>Use cases:</b><br/>
        /// - Display mentor reviews on profile page<br/>
        /// - Analyze mentor performance<br/>
        /// - Filter recent reviews using pagination
        /// </remarks>
        /// <param name="mentorId">The unique identifier of the mentor.</param>
        /// <param name="page">Page number (optional, default 1).</param>
        /// <param name="pageSize">Number of reviews per page (optional, default 10).</param>
        /// <returns>Paginated list of reviews for the mentor.</returns>
        /// <response code="200">Reviews retrieved successfully.</response>
        /// <response code="404">No reviews found for the specified mentor.</response>

        [HttpGet("{mentorId}/reviews")]
        public async Task<ActionResult> GetReviewsForMentor(
          string mentorId,
          [FromQuery] int page = 1,
          [FromQuery] int pageSize = 10)
        {
            _logger.LogInformation("[Review] getting reviews for mentor {MentorId}", mentorId);

            var result = await _reviewService.GetReviewsForMentorAsync(mentorId, page, pageSize);

            return Ok(new ApiResponse<MentorReviewsDto>(
                            result,
                            "Reviews retrieved successfully."));
        }


        // ============ AUTHENTICATED ENDPOINTS ============

        /// <summary>
        /// Get current authenticated mentor's own profile
        /// </summary>
        /// <returns>Current mentor's profile information</returns>
        /// <response code="200">Returns the mentor's profile</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="404">Mentor profile not found</response>
        /// <remarks>
        /// **Authorization:** Requires authenticated user who has registered or applied as a mentor (IsMentor = true).
        /// 
        /// **Note:** Does NOT require Mentor role - users can access their mentor profile even while pending approval.
        /// 
        /// Returns the complete mentor profile for the currently authenticated mentor, including approval status.
        /// </remarks>
        [HttpGet("me")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<MentorProfileDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetMyMentorProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse.Error("Invalid authentication token", 401));
            }

            _logger.LogInformation("User {UserId} requested their mentor profile", userId);

            var mentor = await _mentorService.GetMentorProfileAsync(userId);

            return Ok(new ApiResponse<MentorProfileDto>(
                mentor,
                "Mentor profile retrieved successfully"
            ));
        }

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
                    "Mentor application submitted successfully! Your application is pending approval.",
                    StatusCodes.Status201Created
                ));
        }

        /// <summary>
        /// Update current authenticated mentor's own profile
        /// </summary>
        /// <param name="updateDto">Mentor profile fields to update (all fields optional)</param>
        /// <returns>Updated mentor profile</returns>
        /// <response code="200">Profile updated successfully</response>
        /// <response code="400">Validation failed for one or more fields</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="404">Mentor not found</response>
        /// <remarks>
        /// **Authorization:** Requires authenticated user who has registered or applied as a mentor (IsMentor = true).
        /// 
        /// **Note:** Does NOT require Mentor role - users can update their mentor profile even while pending approval.
        /// 
        /// **All fields are optional** - only provided fields will be updated.
        /// 
        /// **User-related fields:**
        /// - `firstName`: Min 2 chars, max 50 chars
        /// - `lastName`: Min 2 chars, max 50 chars
        /// - `phoneNumber`: Valid phone number format
        /// - `profilePictureUrl`: Valid URL format, max 200 chars
        /// 
        /// **Mentor-specific fields:**
        /// - `bio`: Max 2000 chars
        /// - `expertiseTagIds`: Array of skill IDs (all must be valid and active)
        /// - `yearsOfExperience`: Positive integer
        /// - `certifications`: Max 1000 chars
        /// - `rate30Min`: Session rate for 30 minutes
        /// - `rate60Min`: Session rate for 60 minutes
        /// - `isAvailable`: Availability status
        /// - `categoryIds`: Array of category IDs
        /// </remarks>
        [HttpPatch("me")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<MentorProfileDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> UpdateMyMentorProfile([FromBody] UpdateMentorProfileDto updateDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse.Error("Invalid authentication token", 401));
            }

            _logger.LogInformation("User {UserId} requested to update their mentor profile", userId);

            var updatedMentor = await _mentorService.UpdateMentorProfileAsync(userId, updateDto);

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