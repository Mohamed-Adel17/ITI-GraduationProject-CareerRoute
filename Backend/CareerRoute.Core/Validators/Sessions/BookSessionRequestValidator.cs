using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CareerRoute.Core.DTOs.Sessions;
using FluentValidation;
using Microsoft.Extensions.Options;


namespace CareerRoute.Core.Validators.Sessions
{
    public class BookSessionRequestValidator : AbstractValidator<BookSessionRequestDto>
    {
        public BookSessionRequestValidator()
        {

            RuleFor(x => x.TimeSlotId)
               .NotEmpty()
               .WithMessage("Time slot Id is required.");

            RuleFor(x => x.Topic)
                .MaximumLength(200)
                .WithMessage("Topic must not exceed 200 char");


            RuleFor(x => x.Notes)
                .MaximumLength(1000)
                .WithMessage("Notes must not exceed 1000 char");



        }
    }
}
