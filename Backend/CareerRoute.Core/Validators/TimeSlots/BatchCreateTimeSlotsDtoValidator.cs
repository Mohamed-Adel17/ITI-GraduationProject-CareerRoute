using CareerRoute.Core.DTOs.TimeSlots;
using FluentValidation;

namespace CareerRoute.Core.Validators.TimeSlots
{
    public class BatchCreateTimeSlotsDtoValidator : AbstractValidator<BatchCreateTimeSlotsDto>
    {
        public BatchCreateTimeSlotsDtoValidator()
        {
            RuleFor(x => x.Slots)
                .NotEmpty()
                .WithMessage("Slots array is required")
                .Must(slots => slots != null && slots.Count >= 1)
                .WithMessage("At least one slot is required")
                .Must(slots => slots == null || slots.Count <= 50)
                .WithMessage("Cannot create more than 50 slots in one request");

            RuleForEach(x => x.Slots)
                .SetValidator(new CreateTimeSlotDtoValidator());
        }
    }
}
