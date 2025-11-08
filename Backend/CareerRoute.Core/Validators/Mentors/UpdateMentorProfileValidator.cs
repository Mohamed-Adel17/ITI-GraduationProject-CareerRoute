using CareerRoute.Core.DTOs.Mentors;
using FluentValidation;

namespace CareerRoute.Core.Validators.Mentors
{
    // Validator for UpdateMentorProfileDto - matches API contract requirements
    public class UpdateMentorProfileValidator : AbstractValidator<UpdateMentorProfileDto>
    {
        public UpdateMentorProfileValidator()
        {
            // ============ BIO VALIDATION ============
            // API Contract: Minimum 100 characters, maximum 2000
            RuleFor(x => x.Bio)
                .MinimumLength(100)
                    .WithMessage("Bio must be at least 100 characters")
                .MaximumLength(2000)
                    .WithMessage("Bio cannot exceed 2000 characters")
                .When(x => !string.IsNullOrWhiteSpace(x.Bio));

            // ============ EXPERTISE TAGS VALIDATION ============
            // API Contract: List<string>, minimum 3 tags
            RuleFor(x => x.ExpertiseTags)
                .Must(tags => tags == null || tags.Count >= 3)
                    .WithMessage("At least 3 expertise tags are required")
                .Must(tags => tags == null || tags.All(tag => !string.IsNullOrWhiteSpace(tag)))
                    .WithMessage("Expertise tags cannot be empty")
                .Must(tags => tags == null || tags.All(tag => tag.Length <= 50))
                    .WithMessage("Each expertise tag cannot exceed 50 characters")
                .When(x => x.ExpertiseTags != null);

            // ============ YEARS OF EXPERIENCE VALIDATION ============
            // API Contract: Minimum 1 year, maximum 60
            RuleFor(x => x.YearsOfExperience)
                .GreaterThanOrEqualTo(1)
                    .WithMessage("Years of experience must be at least 1")
                .LessThanOrEqualTo(60)
                    .WithMessage("Years of experience cannot exceed 60 years")
                .When(x => x.YearsOfExperience.HasValue);

            // ============ CERTIFICATIONS VALIDATION ============
            RuleFor(x => x.Certifications)
                .MaximumLength(1000)
                    .WithMessage("Certifications cannot exceed 1000 characters")
                .When(x => !string.IsNullOrWhiteSpace(x.Certifications));

            // ============ PRICING VALIDATION ============
            // API Contract: $5-$500 range for both rates
            RuleFor(x => x.Rate30Min)
                .InclusiveBetween(5, 500)
                    .WithMessage("30-minute rate must be between $5 and $500")
                .When(x => x.Rate30Min.HasValue);

            RuleFor(x => x.Rate60Min)
                .InclusiveBetween(5, 500)
                    .WithMessage("60-minute rate must be between $5 and $500")
                .When(x => x.Rate60Min.HasValue);

            // ============ CATEGORY IDS VALIDATION ============
            // API Contract: 1-5 categories
            RuleFor(x => x.CategoryIds)
                .Must(ids => ids == null || ids.Count >= 1 && ids.Count <= 5)
                    .WithMessage("Must select between 1 and 5 categories")
                .When(x => x.CategoryIds != null);

            // ============ CROSS-PROPERTY VALIDATION ============
            // Business rule: Rate60Min should be >= Rate30Min
            RuleFor(x => x)
                .Must(dto => !dto.Rate60Min.HasValue ||
                             !dto.Rate30Min.HasValue ||
                             dto.Rate60Min >= dto.Rate30Min)
                    .WithMessage("60-minute rate should be at least equal to 30-minute rate")
                    .WithName("Rate60Min");

            // ============ CUSTOM BUSINESS RULES ============
            // Business rule: Rate60Min should not be more than 2.5x Rate30Min
            //RuleFor(x => x)
            //    .Must(HaveReasonablePricing)
            //        .WithMessage("Pricing seems unrealistic. 60-minute rate should not exceed 2.5x the 30-minute rate")
            //        .WithName("Rate60Min")
            //        .When(x => x.Rate30Min.HasValue && x.Rate60Min.HasValue);
        }

        // ============ CUSTOM VALIDATION METHODS ============

        /// <summary>
        /// Business rule: 60-min rate should not be more than 2.5x the 30-min rate
        /// Example: If 30-min = $50, 60-min should be <= $125 (not $300)
        /// </summary>
        //private bool HaveReasonablePricing(UpdateMentorProfileDto dto)
        //{
        //    if (!dto.Rate30Min.HasValue || !dto.Rate60Min.HasValue)
        //        return true; // Skip if rates not set

        //    var maxReasonableRate = dto.Rate30Min.Value * 2.5m;
        //    return dto.Rate60Min.Value <= maxReasonableRate;
        //}
    }
}