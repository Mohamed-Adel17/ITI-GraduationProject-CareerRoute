using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces.Services;
using Microsoft.Extensions.DependencyInjection;


namespace CareerRoute.Infrastructure.Services
{
    public class PaymentFactory : IPaymentFactory
    {
        private readonly IServiceProvider _serviceProvider;

        public PaymentFactory(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public IPaymentService GetService(PaymentMethodOptions option)
        {
            return option switch
            {
                PaymentMethodOptions.Stripe => _serviceProvider.GetRequiredService<StripePaymentService>(),
                PaymentMethodOptions.Paymob => _serviceProvider.GetRequiredService<PaymobPaymentService>(),
                _ => throw new ArgumentOutOfRangeException(nameof(option), option, "Invalid payment provider")
            };
        }
    }
}
