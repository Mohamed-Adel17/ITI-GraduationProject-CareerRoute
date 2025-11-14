using CareerRoute.Core.DTOs.Payments;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Validators.Payments
{
    public class PaymentConfirmRequestValidator : AbstractValidator<PaymentConfirmRequestDto>
    {

        public PaymentConfirmRequestValidator()
        {
            RuleFor(x => x.PaymentIntentId)
                .NotEmpty().WithMessage("PaymentIntentId is required.");

            RuleFor(x => x.SessionId)
                .NotEmpty().WithMessage("SessionId is required.");
        }
    }
}
