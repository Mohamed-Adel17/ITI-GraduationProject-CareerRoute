using CareerRoute.Core.DTOs.TimeSlots;
using FluentValidation;

namespace CareerRoute.Core.Validators.TimeSlots
{
    public class CreateTimeSlotDtoValidator : AbstractValidator<CreateTimeSlotDto>
    {
        public CreateTimeSlotDtoValidator()
        {
            RuleFor(x => x.StartDateTime)
                .NotEmpty()
                .WithMessage("Start date and time is required")
                .Must(BeAtLeast24HoursInFuture)
                .WithMessage("Time slot must be at least 24 hours in the future");

            RuleFor(x => x.DurationMinutes)
                .NotEmpty()
                .WithMessage("Duration is required")
                .Must(BeValidDuration)
                .WithMessage("Duration must be 30 or 60 minutes");
        }

        private bool BeAtLeast24HoursInFuture(DateTime startDateTime)
        {
            var minimumDateTime = DateTime.UtcNow.AddHours(24);
            return startDateTime >= minimumDateTime;
        }

        private bool BeValidDuration(int durationMinutes)
        {
            return durationMinutes == 30 || durationMinutes == 60;
        }
    }
}
