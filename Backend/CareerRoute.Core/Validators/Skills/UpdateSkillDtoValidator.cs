using CareerRoute.Core.DTOs.Skills;
using FluentValidation;

namespace CareerRoute.Core.Validators.Skills
{
    public class UpdateSkillDtoValidator : AbstractValidator<UpdateSkillDto>
    {
        public UpdateSkillDtoValidator()
        {
            RuleFor(x => x.Name)
                .MinimumLength(2).WithMessage("Skill name must be at least 2 characters")
                .MaximumLength(100).WithMessage("Skill name cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.Name));

            RuleFor(x => x.CategoryId)
                .GreaterThan(0).WithMessage("Category ID must be greater than 0")
                .When(x => x.CategoryId.HasValue);
        }
    }
}
