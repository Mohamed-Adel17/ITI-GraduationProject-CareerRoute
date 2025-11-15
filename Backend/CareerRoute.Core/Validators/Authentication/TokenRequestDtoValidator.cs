using CareerRoute.Core.DTOs.Auth;
using FluentValidation;

namespace CareerRoute.Core.Validators.Authentication
{

    public class TokenRequestDtoValidator : AbstractValidator<TokenRequestDto>
    {
        public TokenRequestDtoValidator()
        {
            RuleFor(x => x.RefreshToken)
                .NotEmpty().WithMessage("Refresh token is required");
        }
    }

}
