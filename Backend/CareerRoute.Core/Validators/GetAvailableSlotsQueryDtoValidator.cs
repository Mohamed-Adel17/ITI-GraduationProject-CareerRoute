using CareerRoute.Core.DTOs.TimeSlots;
using FluentValidation;

namespace CareerRoute.Core.Validators
{
    public class GetAvailableSlotsQueryDtoValidator : AbstractValidator<GetAvailableSlotsQueryDto>
    {
        public GetAvailableSlotsQueryDtoValidator()
        {
            RuleFor(x => x.StartDate)
                .LessThan(x => x.EndDate)
                .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
                .WithMessage("Start date must be before end date");

            RuleFor(x => x.DurationMinutes)
                .Must(BeValidDuration)
                .When(x => x.DurationMinutes.HasValue)
                .WithMessage("Duration must be 30 or 60 minutes");

            // Max date range validation
            RuleFor(x => x)
                .Must(x => !x.StartDate.HasValue || !x.EndDate.HasValue || 
                          (x.EndDate.Value - x.StartDate.Value).TotalDays <= 90)
                .WithMessage("Date range cannot exceed 90 days");
        }

        private bool BeValidDuration(int? durationMinutes)
        {
            if (!durationMinutes.HasValue) return true;
            return durationMinutes == 30 || durationMinutes == 60;
        }
    }
}
