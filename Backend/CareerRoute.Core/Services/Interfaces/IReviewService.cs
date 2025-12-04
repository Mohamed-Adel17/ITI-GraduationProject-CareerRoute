using CareerRoute.Core.DTOs.Reviews;

namespace CareerRoute.Core.Services.Interfaces
{
    public interface IReviewService
    {
        Task<CreateReviewResponseDto> AddReviewAsync(string sessionId, string menteeId, CreateReviewRequestDto dto);
        Task<ReviewDetailsItemDto?> GetSessionReviewAsync(string sessionId, string userId);
        Task<MentorReviewsDto> GetReviewsForMentorAsync(string mentorId, int page, int pageSize);
        Task SendReviewRequestEmailAsync(string sessionId);
    }
}
