using CareerRoute.Core.DTOs.Disputes;

namespace CareerRoute.Core.Services.Interfaces
{
    public interface ISessionDisputeService
    {
        Task<DisputeDto> CreateDisputeAsync(string sessionId, string menteeId, CreateDisputeDto dto);
        Task<DisputeDto?> GetDisputeBySessionIdAsync(string sessionId, string userId, string role);
        Task<DisputeDto> GetDisputeByIdAsync(string disputeId);
        Task<AdminDisputeDto> ResolveDisputeAsync(string disputeId, string adminId, ResolveDisputeDto dto);
        Task<AdminDisputeListResponseDto> GetAllDisputesForAdminAsync(AdminDisputeFilterDto filter);
        Task<bool> HasActiveDisputeAsync(string sessionId);
    }
}
