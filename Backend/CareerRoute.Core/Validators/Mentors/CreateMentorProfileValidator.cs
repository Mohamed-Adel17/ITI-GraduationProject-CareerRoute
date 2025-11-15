using CareerRoute.Core.DTOs.Mentors;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Validators.Mentors
{
    public class CreateMentorProfileValidator : AbstractValidator<CreateMentorProfileDto>
    {
        public CreateMentorProfileValidator()
        {
            // Bio validation
            RuleFor(x => x.Bio).NotEmpty().WithMessage("Bio is required")
                .MinimumLength(100).WithMessage("Bio must be at least 100 characters")
                .MaximumLength(2000).WithMessage("Bio cannot exceed 2000 characters");

            // Expertise tag IDs validation (optional - can be added after approval)
            RuleFor(x => x.ExpertiseTagIds)
                .Must(ids => ids == null || ids.All(id => id > 0))
                    .WithMessage("All expertise tag IDs must be greater than 0")
                .When(x => x.ExpertiseTagIds != null && x.ExpertiseTagIds.Any());

            // Years of experience validation
            RuleFor(x => x.YearsOfExperience)
                .NotEmpty().WithMessage("Years of experience is required")
                .InclusiveBetween(1, 60)
                    .WithMessage("Years of experience must be between 1 and 60");

            // Certifications validation
            RuleFor(x => x.Certifications)
                .MaximumLength(1000).WithMessage("Certifications cannot exceed 1000 characters")
                .When(x => !string.IsNullOrWhiteSpace(x.Certifications));

            // Rate30Min validation
            RuleFor(x => x.Rate30Min)
                .NotEmpty().WithMessage("30-minute rate is required")
                .InclusiveBetween(5, 500)
                    .WithMessage("Rate for 30 minutes must be between $5 and $500");

            // Rate60Min validation
            RuleFor(x => x.Rate60Min)
                .NotEmpty().WithMessage("60-minute rate is required")
                .InclusiveBetween(5, 500)
                    .WithMessage("Rate for 60 minutes must be between $5 and $500");

            // Category IDs validation
            RuleFor(x => x.CategoryIds)
                .NotNull().WithMessage("At least one category is required")
                .Must(ids => ids != null && ids.Count >= 1 && ids.Count <= 5)
                    .WithMessage("Must select between 1 and 5 categories");

            // Cross-property validation: Rate60Min >= Rate30Min
            RuleFor(x => x)
                .Must(dto => dto.Rate60Min >= dto.Rate30Min)
                    .WithMessage("60-minute rate should be at least equal to 30-minute rate")
                    .WithName("Rate60Min");
        }
    }
}
