using CareerRoute.Core.DTOs.Payouts;
using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Interfaces
{
    /// <summary>
    /// Service for managing mentor balance operations including tracking earnings,
    /// processing payment releases, and handling balance updates.
    /// </summary>
    public interface IMentorBalanceService
    {
        /// <summary>
        /// Retrieves the balance information for a mentor
        /// </summary>
        /// <param name="mentorId">The mentor's unique identifier</param>
        /// <returns>Mentor balance information</returns>
        Task<MentorBalanceDto> GetMentorBalanceAsync(string mentorId);

        /// <summary>
        /// Initializes balance for a new mentor
        /// </summary>
        /// <param name="mentorId">The mentor's unique identifier</param>
        Task InitializeMentorBalanceAsync(string mentorId);

        /// <summary>
        /// Updates mentor balance when a session is completed.
        /// Called internally by SessionService.
        /// </summary>
        /// <param name="sessionId">The completed session's identifier</param>
        Task UpdateBalanceOnSessionCompletionAsync(string sessionId);
    }
}
