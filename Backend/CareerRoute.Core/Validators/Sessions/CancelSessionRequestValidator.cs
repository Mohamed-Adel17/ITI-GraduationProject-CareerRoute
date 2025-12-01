using CareerRoute.Core.DTOs.Sessions;
using FluentValidation;

namespace CareerRoute.Core.Validators.Sessions
{
    public class CancelSessionRequestValidator : AbstractValidator<CancelSessionRequestDto>
    {
        public CancelSessionRequestValidator()
        {
            RuleFor(c => c.Reason)
                .NotEmpty().WithMessage("Reason is required.")
                .Must(r => r?.Trim().Length >= 10).WithMessage("Reason must be at least 10 characters (excluding whitespace).")
                .MaximumLength(500).WithMessage("Reason cannot exceed 500 characters.");
        }
    }
}
