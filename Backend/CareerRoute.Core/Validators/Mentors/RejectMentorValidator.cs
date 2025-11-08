using CareerRoute.Core.DTOs.Mentors;
using FluentValidation;

namespace CareerRoute.Core.Validators.Mentors
{
    public class RejectMentorValidator : AbstractValidator<RejectMentorDto>
    {
        public RejectMentorValidator()
        {
            RuleFor(x => x.Reason)
                .NotEmpty()
                    .WithMessage("Rejection reason is required")
                .MinimumLength(10)
                    .WithMessage("Rejection reason must be at least 10 characters")
                .MaximumLength(500)
                    .WithMessage("Rejection reason cannot exceed 500 characters");
        }
    }
}
