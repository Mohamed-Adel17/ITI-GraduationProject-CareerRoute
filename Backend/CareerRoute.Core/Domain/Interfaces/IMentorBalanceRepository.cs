using CareerRoute.Core.Domain.Entities;

namespace CareerRoute.Core.Domain.Interfaces
{
    /// <summary>
    /// Repository interface for MentorBalance entity operations
    /// </summary>
    public interface IMentorBalanceRepository : IBaseRepository<MentorBalance>
    {
        /// <summary>
        /// Gets the balance for a specific mentor
        /// </summary>
        /// <param name="mentorId">The mentor's unique identifier</param>
        /// <returns>The mentor's balance or null if not found</returns>
        Task<MentorBalance?> GetByMentorIdAsync(string mentorId);
    }
}
