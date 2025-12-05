using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Disputes;
using FluentValidation;

namespace CareerRoute.Core.Validators.Disputes
{
    public class CreateDisputeValidator : AbstractValidator<CreateDisputeDto>
    {
        public CreateDisputeValidator()
        {
            RuleFor(x => x.Reason)
                .IsInEnum().WithMessage("Invalid dispute reason");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters")
                .NotEmpty().When(x => x.Reason == DisputeReason.Other)
                .WithMessage("Description is required when reason is 'Other'");
        }
    }
}
