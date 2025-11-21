using CareerRoute.Core.DTOs.Mentors;
using FluentValidation;

namespace CareerRoute.Core.Validators.Mentors
{
    public class MentorSearchRequestValidator : AbstractValidator<MentorSearchRequestDto>
    {
        public MentorSearchRequestValidator()
        {
            RuleFor(x => x.Keywords)
                .MinimumLength(2).When(x => !string.IsNullOrWhiteSpace(x.Keywords))
                .WithMessage("Keywords must be at least 2 characters");

            RuleFor(x => x.MinPrice)
                .GreaterThanOrEqualTo(0).When(x => x.MinPrice.HasValue)
                .WithMessage("Minimum price must be 0 or greater");

            RuleFor(x => x.MaxPrice)
                .GreaterThanOrEqualTo(x => x.MinPrice ?? 0).When(x => x.MaxPrice.HasValue && x.MinPrice.HasValue)
                .WithMessage("Maximum price must be greater than or equal to minimum price");

            RuleFor(x => x.MinRating)
                .InclusiveBetween(0, 5).When(x => x.MinRating.HasValue)
                .WithMessage("Minimum rating must be between 0 and 5");

            RuleFor(x => x.Page)
                .GreaterThanOrEqualTo(1)
                .WithMessage("Page must be 1 or greater");

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 50)
                .WithMessage("Page size must be between 1 and 50");

            RuleFor(x => x.SortBy)
                .Must(x => new[] { "popularity", "rating", "priceasc", "pricedesc", "experience" }.Contains(x.ToLower()))
                .WithMessage("Sort by must be one of: popularity, rating, priceAsc, priceDesc, experience");
        }
    }
}
