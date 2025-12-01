using CareerRoute.Core.Constants;
using CareerRoute.Core.DTOs.Auth;
using FluentValidation;


namespace CareerRoute.Core.Validators.Authentication
{
    public class EmailRequestDtoValidator : AbstractValidator<EmailRequestDto>
    {
        public EmailRequestDtoValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .Matches(AppRegex.EmailPattern).WithMessage(AppErrorMessages.InvalidEmailFormat);
        }
    }
}
