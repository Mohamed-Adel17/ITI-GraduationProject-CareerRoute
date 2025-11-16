using CareerRoute.Core.DTOs.Mentors;
using CareerRoute.Core.DTOs.Payments;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Validators.Payments
{
    public class PaymentIntentRequestValidator : AbstractValidator<PaymentIntentRequestDto>
    {
        public PaymentIntentRequestValidator()
        {
            RuleFor(x => x.SessionId)
                .NotEmpty().WithMessage("SessionId is required.");

            RuleFor(x => x.PaymentMethod)
                .IsInEnum().WithMessage("PaymentMethod must be Stripe or Paymob.");
        }
    }
}
