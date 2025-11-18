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

        public IPaymentService GetService(PaymentProviderOptions option)
        {
            return option switch
            {
                PaymentProviderOptions.Stripe => _serviceProvider.GetRequiredService<StripePaymentService>(),
                PaymentProviderOptions.Paymob => _serviceProvider.GetRequiredService<PaymobPaymentService>(),
                _ => throw new ArgumentOutOfRangeException(nameof(option), option, "Invalid payment provider")
            };
        }
    }
}
