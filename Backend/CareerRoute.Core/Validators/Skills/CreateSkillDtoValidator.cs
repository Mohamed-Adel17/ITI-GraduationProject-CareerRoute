using CareerRoute.Core.DTOs.Skills;
using FluentValidation;

namespace CareerRoute.Core.Validators.Skills
{
    public class CreateSkillDtoValidator : AbstractValidator<CreateSkillDto>
    {
        public CreateSkillDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Skill name is required")
                .MinimumLength(2).WithMessage("Skill name must be at least 2 characters")
                .MaximumLength(100).WithMessage("Skill name cannot exceed 100 characters");

            RuleFor(x => x.CategoryId)
                .NotEmpty().WithMessage("Category ID is required")
                .GreaterThan(0).WithMessage("Category ID must be greater than 0");
        }
    }
}
