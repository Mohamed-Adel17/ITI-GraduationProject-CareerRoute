using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Disputes;

namespace CareerRoute.Core.Domain.Interfaces
{
    public interface ISessionDisputeRepository : IBaseRepository<SessionDispute>
    {
        Task<SessionDispute?> GetBySessionIdAsync(string sessionId);
        Task<SessionDispute?> GetByIdWithDetailsAsync(string disputeId);
        Task<bool> HasActiveDisputeAsync(string sessionId);
        Task<(IEnumerable<SessionDispute> Disputes, int TotalCount)> GetFilteredDisputesAsync(AdminDisputeFilterDto filter);
    }
}
