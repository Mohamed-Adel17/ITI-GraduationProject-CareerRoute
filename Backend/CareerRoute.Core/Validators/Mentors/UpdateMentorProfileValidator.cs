using CareerRoute.Core.DTOs.Mentors;
using FluentValidation;

namespace CareerRoute.Core.Validators.Mentors
{
    // Validator for UpdateMentorProfileDto - matches API contract requirements
    public class UpdateMentorProfileValidator : AbstractValidator<UpdateMentorProfileDto>
    {
        public UpdateMentorProfileValidator()
        {
            // ============ USER-RELATED FIELDS VALIDATION ============
            RuleFor(x => x.FirstName)
                .MinimumLength(2)
                    .WithMessage("First name must be at least 2 characters")
                .MaximumLength(50)
                    .WithMessage("First name cannot exceed 50 characters")
                .When(x => !string.IsNullOrEmpty(x.FirstName));

            RuleFor(x => x.LastName)
                .MinimumLength(2)
                    .WithMessage("Last name must be at least 2 characters")
                .MaximumLength(50)
                    .WithMessage("Last name cannot exceed 50 characters")
                .When(x => !string.IsNullOrEmpty(x.LastName));

            RuleFor(x => x.PhoneNumber)
                .Matches(@"^[\d\s\-\+\(\)]+$")
                    .WithMessage("Invalid phone number format")
                .When(x => !string.IsNullOrEmpty(x.PhoneNumber));

            RuleFor(x => x.ProfilePicture)
                .Must(file =>
                {
                    if (file == null) return true;
                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
                    var extension = Path.GetExtension(file.FileName).ToLower();
                    return allowedExtensions.Contains(extension);
                })
                .WithMessage("Only .jpg, .jpeg, or .png images are allowed")

                .Must(file => file == null || file.Length <= 2 * 1024 * 1024) // 2 MB
                .WithMessage("Profile picture must not exceed 2 MB");


            // ============ BIO VALIDATION ============
            // API Contract: Minimum 100 characters, maximum 2000
            RuleFor(x => x.Bio)
                .MinimumLength(100)
                    .WithMessage("Bio must be at least 100 characters")
                .MaximumLength(2000)
                    .WithMessage("Bio cannot exceed 2000 characters")
                .When(x => !string.IsNullOrWhiteSpace(x.Bio));

            // ============ EXPERTISE TAG IDS VALIDATION ============
            // API Contract: List<int>, minimum 1 tag
            RuleFor(x => x.ExpertiseTagIds)
                .Must(ids => ids == null || ids.Count >= 1)
                    .WithMessage("At least 1 expertise tag is required")
                .Must(ids => ids == null || ids.All(id => id > 0))
                    .WithMessage("All expertise tag IDs must be greater than 0")
                .When(x => x.ExpertiseTagIds != null);

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

            RuleFor(x => x.Cv)
                .Must(file => file == null || file.Length > 0)
                    .WithMessage("Profile picture is empty")
                .Must(file =>
                {
                    if (file == null) return true;
                    var allowedExtensions = new[] { ".pdf" };
                    var extension = Path.GetExtension(file.FileName).ToLower();
                    return allowedExtensions.Contains(extension);
                })
                    .WithMessage("Only .pdf is allowed")
                .Must(file => file == null || file.Length <= 5 * 1024 * 1024) // 2 MB
                    .WithMessage("CV must not exceed 5 MB");

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