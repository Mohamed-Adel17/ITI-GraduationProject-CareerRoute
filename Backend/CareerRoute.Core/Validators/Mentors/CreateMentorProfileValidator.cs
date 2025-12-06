using CareerRoute.Core.DTOs.Mentors;
using FluentValidation;

namespace CareerRoute.Core.Validators.Mentors
{
    public class CreateMentorProfileValidator : AbstractValidator<CreateMentorProfileDto>
    {
        public CreateMentorProfileValidator()
        {
            RuleFor(x => x.Headline)
                .MaximumLength(200).WithMessage("Headline cannot exceed 200 characters")
                .When(x => !string.IsNullOrWhiteSpace(x.Headline));

            RuleFor(x => x.Bio).NotEmpty().WithMessage("Bio is required")
                .MinimumLength(50).WithMessage("Bio must be at least 50 characters")
                .MaximumLength(2000).WithMessage("Bio cannot exceed 2000 characters");

            RuleFor(x => x.ExpertiseTagIds)
                .Must(ids => ids == null || ids.All(id => id > 0))
                    .WithMessage("All expertise tag IDs must be greater than 0")
                .When(x => x.ExpertiseTagIds != null && x.ExpertiseTagIds.Any());

            RuleFor(x => x.YearsOfExperience)
                .NotEmpty().WithMessage("Years of experience is required")
                .InclusiveBetween(1, 60).WithMessage("Years of experience must be between 1 and 60");

            RuleFor(x => x.Certifications)
                .MaximumLength(1000).WithMessage("Certifications cannot exceed 1000 characters")
                .When(x => !string.IsNullOrWhiteSpace(x.Certifications));

            RuleFor(x => x.Rate30Min)
                .NotEmpty().WithMessage("30-minute rate is required")
                .InclusiveBetween(5, 500).WithMessage("Rate for 30 minutes must be between $5 and $500");

            RuleFor(x => x.Rate60Min)
                .NotEmpty().WithMessage("60-minute rate is required")
                .InclusiveBetween(5, 500).WithMessage("Rate for 60 minutes must be between $5 and $500");

            RuleFor(x => x.CategoryIds)
                .NotNull().WithMessage("At least one category is required")
                .Must(ids => ids != null && ids.Count >= 1 && ids.Count <= 5)
                    .WithMessage("Must select between 1 and 5 categories");

            RuleFor(x => x)
                .Must(dto => dto.Rate60Min >= dto.Rate30Min)
                    .WithMessage("60-minute rate should be at least equal to 30-minute rate")
                    .WithName("Rate60Min");

            RuleForEach(x => x.PreviousWorks).SetValidator(new CreatePreviousWorkValidator())
                .When(x => x.PreviousWorks != null && x.PreviousWorks.Any());
        }
    }

    public class CreatePreviousWorkValidator : AbstractValidator<CreatePreviousWorkDto>
    {
        public CreatePreviousWorkValidator()
        {
            RuleFor(x => x.CompanyName)
                .NotEmpty().WithMessage("Company name is required")
                .MaximumLength(200).WithMessage("Company name cannot exceed 200 characters");
            
            RuleFor(x => x.JobTitle)
                .NotEmpty().WithMessage("Job title is required")
                .MaximumLength(200).WithMessage("Job title cannot exceed 200 characters");
            
            RuleFor(x => x.StartDate)
                .NotEmpty().WithMessage("Start date is required")
                .LessThanOrEqualTo(DateTime.UtcNow).WithMessage("Start date cannot be in the future")
                .GreaterThanOrEqualTo(new DateTime(1960, 1, 1)).WithMessage("Start date must be after 1960");
            
            RuleFor(x => x.EndDate)
                .LessThanOrEqualTo(DateTime.UtcNow).WithMessage("End date cannot be in the future")
                .When(x => x.EndDate != null);
            
            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Description cannot exceed 1000 characters")
                .When(x => x.Description != null);
            
            RuleFor(x => x)
                .Must(x => x.EndDate == null || x.EndDate >= x.StartDate)
                .WithMessage("End date must be after start date");
        }
    }
}
