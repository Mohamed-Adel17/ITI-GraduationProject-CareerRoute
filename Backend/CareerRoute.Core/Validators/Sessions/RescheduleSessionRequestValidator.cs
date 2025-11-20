using CareerRoute.Core.DTOs.Sessions;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Validators.Sessions
{
    public class RescheduleSessionRequestValidator : AbstractValidator<RescheduleSessionRequestDto>
    {
        public RescheduleSessionRequestValidator()
        {
            RuleFor(x => x.Reason)
                .NotEmpty().WithMessage("Reason is required.")
                .MinimumLength(10).WithMessage("Reason must be at least 10 characters long.")
                .MaximumLength(500).WithMessage("Reason cannot exceed 500 characters.");

            RuleFor(x => x.NewScheduledStartTime)
                .NotEmpty().WithMessage("New scheduled start time is required.")
                .Must(BeAtLeast24HoursFromNow)
                .WithMessage("New scheduled start time must be at least 24 hours from now.");
        }

        private bool BeAtLeast24HoursFromNow(DateTime newTime)
        {
            return newTime >= DateTime.UtcNow.AddHours(24);
        }
    }
}
