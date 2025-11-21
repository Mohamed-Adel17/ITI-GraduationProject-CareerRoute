using CareerRoute.Core.DTOs.TimeSlots;
using FluentValidation;

namespace CareerRoute.Core.Validators.TimeSlots
{
    public class GetMentorSlotsQueryDtoValidator : AbstractValidator<GetMentorSlotsQueryDto>
    {
        public GetMentorSlotsQueryDtoValidator()
        {
            RuleFor(x => x.Page)
                .GreaterThanOrEqualTo(1)
                .WithMessage("Page must be greater than or equal to 1");

            RuleFor(x => x.PageSize)
                .InclusiveBetween(1, 100)
                .WithMessage("Page size must be between 1 and 100");

            RuleFor(x => x.StartDate)
                .LessThan(x => x.EndDate)
                .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
                .WithMessage("Start date must be before end date");

            // Max date range validation
            RuleFor(x => x)
                .Must(x => !x.StartDate.HasValue || !x.EndDate.HasValue || 
                          (x.EndDate.Value - x.StartDate.Value).TotalDays <= 90)
                .WithMessage("Date range cannot exceed 90 days");
        }
    }
}
