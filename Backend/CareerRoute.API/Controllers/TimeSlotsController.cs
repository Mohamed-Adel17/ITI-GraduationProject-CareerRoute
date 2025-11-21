using CareerRoute.API.Models;
using CareerRoute.Core.DTOs.TimeSlots;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CareerRoute.API.Controllers
{
    /// <summary>
    /// Manages time slot availability for mentors
    /// </summary>
    [Route("api/mentors/{mentorId}/time-slots")]
    [ApiController]
    [Produces("application/json")]
    public class TimeSlotsController : ControllerBase
    {
        private readonly ITimeSlotService _timeSlotService;
        private readonly ILogger<TimeSlotsController> _logger;

        public TimeSlotsController(
            ITimeSlotService timeSlotService,
            ILogger<TimeSlotsController> logger)
        {
            _timeSlotService = timeSlotService;
            _logger = logger;
        }

        // ============ PUBLIC ENDPOINTS ============

        /// <summary>
        /// Get available time slots for a mentor (Public)
        /// </summary>
        /// <param name="mentorId">Mentor ID</param>
        /// <param name="query">Query parameters for filtering slots</param>
        /// <returns>Available slots for the mentor</returns>
        /// <response code="200">Returns available slots</response>
        /// <response code="400">Invalid query parameters</response>
        /// <response code="404">Mentor not found or no available slots</response>
        /// <remarks>
        /// **Default Behavior (No Query Parameters):**
        /// - Returns all available slots starting **24 hours from now** (respects advance booking rule)
        /// - Extends up to **90 days** into the future
        /// - Only includes unbooked slots (IsBooked = false)
        /// - Automatically filters out slots less than 24 hours away
        /// 
        /// **Query Parameters:**
        /// - `startDate` (optional): Filter from this date (default: 24 hours from now)
        /// - `endDate` (optional): Filter until this date (default: startDate + 90 days, max: 90 days range)
        /// - `durationMinutes` (optional): Filter by duration (30 or 60 minutes)
        /// 
        /// **Note:** The 24-hour advance booking rule is always enforced, even if you provide an earlier startDate.
        /// </remarks>
        [HttpGet("~/api/mentors/{mentorId}/available-slots")]
        [ProducesResponseType(typeof(ApiResponse<AvailableSlotsResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetAvailableSlots(
            string mentorId,
            [FromQuery] GetAvailableSlotsQueryDto query)
        {
            var result = await _timeSlotService.GetAvailableSlotsAsync(mentorId, query);

            if (result.TotalCount == 0)
            {
                return NotFound(ApiResponse.Error("No available slots found for the specified date range", 404));
            }

            return Ok(new ApiResponse<AvailableSlotsResponseDto>(
                result,
                "Available slots retrieved successfully"));
        }

        // ============ AUTHENTICATED ENDPOINTS ============

        /// <summary>
        /// Create time slot(s) for a mentor (Authenticated - Mentor or Admin)
        /// </summary>
        /// <param name="mentorId">Mentor ID</param>
        /// <param name="requestBody">Single slot or batch creation data</param>
        /// <returns>Created time slot(s)</returns>
        /// <response code="201">Time slot(s) created successfully</response>
        /// <response code="400">Validation failed</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User doesn't have permission</response>
        /// <response code="409">Slot already exists at this time</response>
        /// <remarks>
        /// Supports both single slot creation and batch creation.
        /// 
        /// **Single Slot Creation:**
        /// ```json
        /// {
        ///   "startDateTime": "2025-12-15T14:00:00Z",
        ///   "durationMinutes": 60
        /// }
        /// ```
        /// 
        /// **Batch Creation (max 50 slots):**
        /// ```json
        /// {
        ///   "slots": [
        ///     { "startDateTime": "2025-12-15T14:00:00Z", "durationMinutes": 60 },
        ///     { "startDateTime": "2025-12-15T16:00:00Z", "durationMinutes": 30 }
        ///   ]
        /// }
        /// ```
        /// </remarks>
        [HttpPost]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<TimeSlotDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<List<TimeSlotDto>>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult> CreateTimeSlots(
            string mentorId,
            [FromBody] System.Text.Json.JsonElement requestBody)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse.Error("Invalid authentication token", 401));
            }

            var jsonOptions = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            // Check if it's a batch request (has "slots" array)
            if (requestBody.TryGetProperty("slots", out _))
            {
                var batchDto = System.Text.Json.JsonSerializer.Deserialize<BatchCreateTimeSlotsDto>(
                    requestBody.GetRawText(),
                    jsonOptions);

                if (batchDto?.Slots != null && batchDto.Slots.Any())
                {
                    _logger.LogInformation("User {UserId} creating {Count} time slots for mentor {MentorId}",
                        userId, batchDto.Slots.Count, mentorId);

                    var createdSlots = await _timeSlotService.CreateTimeSlotsAsync(mentorId, userId, batchDto);

                    return CreatedAtAction(
                        nameof(GetMentorTimeSlots),
                        new { mentorId },
                        new ApiResponse<List<TimeSlotDto>>(
                            createdSlots,
                            $"{createdSlots.Count} time slots created successfully",
                            StatusCodes.Status201Created));
                }
            }

            // Otherwise, treat as single slot request
            var singleDto = System.Text.Json.JsonSerializer.Deserialize<CreateTimeSlotDto>(
                requestBody.GetRawText(),
                jsonOptions);

            if (singleDto != null)
            {
                _logger.LogInformation("User {UserId} creating time slot for mentor {MentorId}",
                    userId, mentorId);

                var createdSlot = await _timeSlotService.CreateTimeSlotAsync(mentorId, userId, singleDto);

                return CreatedAtAction(
                    nameof(GetMentorTimeSlots),
                    new { mentorId },
                    new ApiResponse<TimeSlotDto>(
                        createdSlot,
                        "Time slot created successfully",
                        StatusCodes.Status201Created));
            }

            return BadRequest(ApiResponse.Error("Invalid request body", 400));
        }

        /// <summary>
        /// Get all time slots for a mentor (Authenticated - Mentor or Admin)
        /// </summary>
        /// <param name="mentorId">Mentor ID</param>
        /// <param name="query">Query parameters for filtering and pagination</param>
        /// <returns>Paginated list of time slots</returns>
        /// <response code="200">Returns time slots</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User doesn't have permission</response>
        /// <response code="404">No time slots found</response>
        /// <remarks>
        /// This endpoint returns ALL time slots (both available and booked) for mentor management.
        /// It does NOT enforce the 24-hour advance booking rule since mentors need to see all their slots.
        /// </remarks>
        [HttpGet]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<TimeSlotListResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetMentorTimeSlots(
            string mentorId,
            [FromQuery] GetMentorSlotsQueryDto query)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse.Error("Invalid authentication token", 401));
            }

            _logger.LogInformation("User {UserId} retrieving time slots for mentor {MentorId}",
                userId, mentorId);

            var result = await _timeSlotService.GetMentorTimeSlotsAsync(mentorId, userId, query);

            if (result.TimeSlots.Count == 0)
            {
                return NotFound(ApiResponse.Error("No time slots found", 404));
            }

            return Ok(new ApiResponse<TimeSlotListResponseDto>(
                result,
                "Time slots retrieved successfully"));
        }

        /// <summary>
        /// Delete a time slot (Authenticated - Mentor or Admin)
        /// </summary>
        /// <param name="mentorId">Mentor ID</param>
        /// <param name="slotId">Time slot ID to delete</param>
        /// <returns>Success message</returns>
        /// <response code="200">Time slot deleted successfully</response>
        /// <response code="401">User not authenticated</response>
        /// <response code="403">User doesn't have permission</response>
        /// <response code="404">Time slot not found</response>
        /// <response code="409">Cannot delete booked slot</response>
        [HttpDelete("{slotId}")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult> DeleteTimeSlot(
            string mentorId,
            string slotId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(ApiResponse.Error("Invalid authentication token", 401));
            }

            _logger.LogInformation("User {UserId} deleting time slot {SlotId} for mentor {MentorId}",
                userId, slotId, mentorId);

            await _timeSlotService.DeleteTimeSlotAsync(mentorId, slotId, userId);

            return Ok(new ApiResponse<object>(
                null,
                "Time slot deleted successfully"));
        }
    }
}
