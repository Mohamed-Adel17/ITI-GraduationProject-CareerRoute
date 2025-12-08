using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Payouts;

namespace CareerRoute.Core.Domain.Interfaces
{
    public interface IPayoutRepository : IBaseRepository<Payout>
    {
        Task<(IEnumerable<Payout> Payouts, int TotalCount)> GetPayoutHistoryWithCountAsync(string mentorId, int page, int pageSize);
        Task<Payout?> GetByIdWithMentorAsync(string payoutId);
        Task<IEnumerable<Payout>> GetByStatusAsync(PayoutStatus status);
        Task<(IEnumerable<Payout> Payouts, int TotalCount)> GetFilteredPayoutsAsync(AdminPayoutFilterDto filter);
    }
}
