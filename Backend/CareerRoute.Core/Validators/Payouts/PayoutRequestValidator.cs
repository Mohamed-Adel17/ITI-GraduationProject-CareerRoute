using CareerRoute.Core.DTOs.Payouts;
using FluentValidation;

namespace CareerRoute.Core.Validators.Payouts
{
    /// <summary>
    /// Validator for payout request DTOs
    /// </summary>
    public class PayoutRequestValidator : AbstractValidator<PayoutRequestDto>
    {
        public PayoutRequestValidator()
        {
            RuleFor(x => x.Amount)
                .NotEmpty().WithMessage("Payout amount is required")
                .GreaterThanOrEqualTo(250).WithMessage("Payout amount must be greater than or equal 250.00")
                .LessThanOrEqualTo(100000).WithMessage("Payout amount cannot exceed 100,000.00");

        }
    }
}
