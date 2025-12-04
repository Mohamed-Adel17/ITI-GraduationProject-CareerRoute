using CareerRoute.Core.Domain.Entities;

namespace CareerRoute.Core.Domain.Interfaces
{
    public interface IReviewRepository : IBaseRepository<ReviewSession>
    {
        Task<decimal> GetMentorAverageRatingAsync(string mentorId);
        Task<ReviewSession?> GetByIdWithRelationsAsync(string reviewId);
        Task<ReviewSession?> GetBySessionIdAsync(string sessionId);
        Task<(List<ReviewSession> Items, int TotalCount)> GetReviewsForMentorAsync(string mentorId, int page, int pageSize);
    }
}
