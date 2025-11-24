using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Payments;
using FluentValidation;

namespace CareerRoute.Core.Validators.Payments
{
    public class PaymentIntentRequestValidator : AbstractValidator<PaymentIntentRequestDto>
    {
        public PaymentIntentRequestValidator()
        {
            RuleFor(x => x.SessionId)
                .NotEmpty().WithMessage("SessionId is required.");

            RuleFor(x => x.PaymentProvider)
                .NotEmpty()
                .IsInEnum().WithMessage("PaymentProvider must be Stripe or Paymob.");

            RuleFor(x => x.PaymobPaymentMethod)
                .IsInEnum().WithMessage("Invalid PaymobPaymentMethod value.")
                .When(x => x.PaymentProvider == PaymentProviderOptions.Paymob);
        }
    }
}
