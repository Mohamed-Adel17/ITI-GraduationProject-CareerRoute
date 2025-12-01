using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Mentors;
namespace CareerRoute.Core.Domain.Interfaces
{
    public interface IPaymentRepository : IBaseRepository<Payment>
    {
        Task<Payment?> GetByPaymentIntentIdAsync(string paymentIntentId);
        Task<IEnumerable<Payment>> GetPaymentHistoryWithSessionAsync
            (string userId, int page = 1, int pageSize = 10, PaymentStatusOptions? status = null);
        Task<int> GetPaymentHistoryCountAsync(string userId, PaymentStatusOptions? status = null);


    }
}
