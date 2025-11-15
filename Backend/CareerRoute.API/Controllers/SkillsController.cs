using CareerRoute.API.Models;
using CareerRoute.Core.DTOs.Skills;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CareerRoute.API.Controllers
{
    /// <summary>
    /// Manages skills for career interests and mentor expertise
    /// </summary>
    [Route("api/skills")]
    [ApiController]
    [Produces("application/json")]
    public class SkillsController : ControllerBase
    {
        private readonly ISkillService _skillService;
        private readonly ILogger<SkillsController> _logger;

        public SkillsController(ISkillService skillService, ILogger<SkillsController> logger)
        {
            _skillService = skillService;
            _logger = logger;
        }

        /// <summary>
        /// Get all skills (Public)
        /// </summary>
        /// <param name="categoryId">Filter by category ID</param>
        /// <param name="isActive">Filter by active status (default: true)</param>
        /// <returns>List of skills</returns>
        /// <response code="200">Returns list of skills</response>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<SkillDto>>), StatusCodes.Status200OK)]
        public async Task<ActionResult> GetAllSkills([FromQuery] int? categoryId = null, [FromQuery] bool? isActive = true)
        {
            var skills = await _skillService.GetAllSkillsAsync(categoryId, isActive);
            return Ok(new ApiResponse<IEnumerable<SkillDto>>(skills, "Skills retrieved successfully"));
        }

        /// <summary>
        /// Get skill by ID (Public)
        /// </summary>
        /// <param name="id">Skill ID</param>
        /// <returns>Skill details</returns>
        /// <response code="200">Returns the skill</response>
        /// <response code="404">Skill not found</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<SkillDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        public async Task<ActionResult> GetSkillById(int id)
        {
            var skill = await _skillService.GetSkillByIdAsync(id);
            return Ok(new ApiResponse<SkillDetailDto>(skill, "Skill retrieved successfully"));
        }

        /// <summary>
        /// Create a new skill (Admin only)
        /// </summary>
        /// <param name="dto">Skill creation data</param>
        /// <returns>Created skill</returns>
        /// <response code="201">Skill created successfully</response>
        /// <response code="400">Validation failed</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden - Admin access required</response>
        /// <response code="409">Skill already exists</response>
        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<SkillDetailDto>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult> CreateSkill([FromBody] CreateSkillDto dto)
        {
            _logger.LogInformation("Admin creating new skill: {SkillName}", dto.Name);

            var skill = await _skillService.CreateSkillAsync(dto);

            return CreatedAtAction(
                nameof(GetSkillById),
                new { id = skill.Id },
                new ApiResponse<SkillDetailDto>(skill, "Skill created successfully"));
        }

        /// <summary>
        /// Update a skill (Admin only)
        /// </summary>
        /// <param name="id">Skill ID</param>
        /// <param name="dto">Skill update data</param>
        /// <returns>Updated skill</returns>
        /// <response code="200">Skill updated successfully</response>
        /// <response code="400">Validation failed</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden - Admin access required</response>
        /// <response code="404">Skill not found</response>
        /// <response code="409">Skill name already exists</response>
        [HttpPatch("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<SkillDetailDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult> UpdateSkill(int id, [FromBody] UpdateSkillDto dto)
        {
            _logger.LogInformation("Admin updating skill ID: {SkillId}", id);

            var skill = await _skillService.UpdateSkillAsync(id, dto);

            return Ok(new ApiResponse<SkillDetailDto>(skill, "Skill updated successfully"));
        }

        /// <summary>
        /// Delete a skill (Admin only)
        /// </summary>
        /// <param name="id">Skill ID</param>
        /// <returns>Success message</returns>
        /// <response code="200">Skill deleted successfully</response>
        /// <response code="401">Unauthorized</response>
        /// <response code="403">Forbidden - Admin access required</response>
        /// <response code="404">Skill not found</response>
        /// <response code="409">Skill is in use and cannot be deleted</response>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
        public async Task<ActionResult> DeleteSkill(int id)
        {
            _logger.LogInformation("Admin deleting skill ID: {SkillId}", id);

            await _skillService.DeleteSkillAsync(id);

            return Ok(new ApiResponse { Message = "Skill deleted successfully" });
        }
    }
}
