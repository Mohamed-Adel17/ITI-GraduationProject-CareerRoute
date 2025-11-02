using CareerRoute.Core.DTOs.Mentors;

namespace CareerRoute.Core.Services.Interfaces
{
    // Service interface for mentor-related business operations
    public interface IMentorService
    {
        // Get a mentor's complete profile by ID
        Task<MentorProfileDto> GetMentorProfileAsync(string mentorId);

        // Get all approved mentors (for public listing)
        Task<IEnumerable<MentorProfileDto>> GetAllApprovedMentorsAsync();

        // Update a mentor's profile (only mentor themselves can update)
        Task<MentorProfileDto> UpdateMentorProfileAsync(string mentorId, UpdateMentorProfileDto updateDto);

        // Create a new mentor profile (user applying to become a mentor)
        Task<MentorProfileDto> CreateMentorProfileAsync(string userId, CreateMentorProfileDto createDto);

        // Search mentors by keywords (bio, expertise tags, name)
        Task<IEnumerable<MentorProfileDto>> SearchMentorsAsync(string searchTerm);

        // Get top-rated mentors (for featured sections)
        Task<IEnumerable<MentorProfileDto>> GetTopRatedMentorsAsync(int count = 10);

        // Get all mentors pending admin approval (admin-only)
        Task<IEnumerable<MentorProfileDto>> GetPendingMentorApplicationsAsync();

        // Approve a mentor application (admin-only)
        Task ApproveMentorAsync(string mentorId);

        // Reject a mentor application (admin-only)
        Task RejectMentorAsync(string mentorId, string reason);

        // Check if a user is already a mentor (prevents duplicate applications)
        Task<bool> IsMentorAsync(string id);
    }
}
