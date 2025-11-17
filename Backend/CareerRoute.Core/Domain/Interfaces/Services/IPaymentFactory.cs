using CareerRoute.Core.Domain.Enums;

namespace CareerRoute.Core.Domain.Interfaces.Services
{
    public interface IPaymentFactory
    {
        IPaymentService GetService(PaymentMethodOptions provider);
    }
}
