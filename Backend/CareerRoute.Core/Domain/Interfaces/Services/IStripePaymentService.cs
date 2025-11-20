
using CareerRoute.Core.External.Payment;

namespace CareerRoute.Core.Domain.Interfaces.Services
{
    public interface IStripePaymentService : IPaymentService
    {
        Task<PaymentIntentResponse> CancelPaymentIntentAsync(string paymentIntentId);
    }
}
