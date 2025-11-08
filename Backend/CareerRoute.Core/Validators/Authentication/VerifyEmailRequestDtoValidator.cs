using CareerRoute.Core.Constants;
using CareerRoute.Core.DTOs.Auth;
using FluentValidation;


namespace CareerRoute.Core.Validators.Authentication
{
    public class VerifyEmailRequestDtoValidator : AbstractValidator<VerifyEmailRequestDto>
    {
        public VerifyEmailRequestDtoValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .Matches(AppRegex.EmailPattern).WithMessage(AppErrorMessages.InvalidEmailFormat);

            RuleFor(x => x.Token)
                .NotEmpty().WithMessage("Verification token is required");
        }
    }

}
