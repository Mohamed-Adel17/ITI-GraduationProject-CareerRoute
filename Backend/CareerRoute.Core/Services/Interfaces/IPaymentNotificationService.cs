using CareerRoute.Core.Domain.Enums;

namespace CareerRoute.Core.Services.Interfaces
{
    public interface IPaymentNotificationService
    {
        Task NotifyPaymentStatusAsync(string paymentIntentId, PaymentStatusOptions status);
    }
}
