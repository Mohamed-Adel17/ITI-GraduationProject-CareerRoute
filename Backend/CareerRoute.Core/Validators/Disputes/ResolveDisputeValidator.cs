using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Disputes;
using FluentValidation;

namespace CareerRoute.Core.Validators.Disputes
{
    public class ResolveDisputeValidator : AbstractValidator<ResolveDisputeDto>
    {
        public ResolveDisputeValidator()
        {
            RuleFor(x => x.Resolution)
                .IsInEnum().WithMessage("Invalid resolution");

            RuleFor(x => x.RefundAmount)
                .GreaterThan(0).When(x => x.Resolution != DisputeResolution.NoRefund)
                .WithMessage("Refund amount must be greater than 0 for refund resolutions");

            RuleFor(x => x.AdminNotes)
                .MaximumLength(1000).WithMessage("Admin notes cannot exceed 1000 characters");
        }
    }
}
