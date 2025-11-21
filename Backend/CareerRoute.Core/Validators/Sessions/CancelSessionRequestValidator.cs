using CareerRoute.Core.DTOs.Sessions;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Validators.Sessions
{
    public class CancelSessionRequestValidator : AbstractValidator<CancelSessionRequestDto>
    {
        public CancelSessionRequestValidator()
        {

            RuleFor(c => c.Reason)
            .NotEmpty().WithMessage("Reason is required.")
            .MinimumLength(10).WithMessage("Reason must be at least 10 characters.")
            .MaximumLength(500).WithMessage("Reason cannot exceed 500 characters.");
        }
    }
}
