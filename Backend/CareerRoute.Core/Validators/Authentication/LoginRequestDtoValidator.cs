using CareerRoute.Core.Constants;
using CareerRoute.Core.DTOs.Auth;
using FluentValidation;


namespace CareerRoute.Core.Validators.Authentication
{
    public class LoginRequestDtoValidator : AbstractValidator<LoginRequestDto>
    {
        public LoginRequestDtoValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .Matches(AppRegex.EmailPattern).WithMessage(AppErrorMessages.InvalidEmailFormat);

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required");
        }
    }
}
