using CareerRoute.Core.DTOs.Reviews;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Validators.Reviews
{
    public class CreateReviewRequestValidator : AbstractValidator<CreateReviewRequestDto>
    {
        public CreateReviewRequestValidator()
        {

            RuleFor(x => x.Rating)
                .NotEmpty().WithMessage("Rating is required.")
                .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5.");

            RuleFor(x => x.Comment)
                .MaximumLength(500).WithMessage("Comment cannot exceed 500 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.Comment));

            RuleFor(x => x.Comment)
                .MinimumLength(5).WithMessage("Comment must be at least 5 characters long.")
                .When(x => !string.IsNullOrWhiteSpace(x.Comment));
        }
    }

}