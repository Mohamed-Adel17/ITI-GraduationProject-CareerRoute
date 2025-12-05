using CareerRoute.Core.DTOs.Payouts;

namespace CareerRoute.Core.Services.Interfaces
{
    public interface IPayoutService
    {
        Task<PayoutDto> RequestPayoutAsync(string mentorId, PayoutRequestDto request);
        Task<PayoutHistoryResponseDto> GetPayoutHistoryAsync(string mentorId, int page, int pageSize);
        Task<PayoutDto> ProcessPayoutAsync(string payoutId);
        Task<PayoutDto> CancelPayoutAsync(string payoutId);
        Task<PayoutDto> GetPayoutDetailsAsync(string payoutId, string mentorId, string role);
        Task<AdminPayoutListResponseDto> GetAllPayoutsForAdminAsync(AdminPayoutFilterDto filter);
    }
}
