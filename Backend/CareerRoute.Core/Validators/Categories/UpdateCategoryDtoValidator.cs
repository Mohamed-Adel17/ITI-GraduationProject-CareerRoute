using CareerRoute.Core.DTOs.Categories;
using FluentValidation;

namespace CareerRoute.Core.Validators.Categories
{
    public class UpdateCategoryDtoValidator : AbstractValidator<UpdateCategoryDto>
    {
        public UpdateCategoryDtoValidator()
        {
            RuleFor(x => x.Name)
                .MinimumLength(2).WithMessage("Category name must be at least 2 characters")
                .MaximumLength(100).WithMessage("Category name cannot exceed 100 characters")
                .When(x => !string.IsNullOrEmpty(x.Name));

            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Description cannot exceed 500 characters")
                .When(x => !string.IsNullOrEmpty(x.Description));

            RuleFor(x => x.IconUrl)
                .MaximumLength(200).WithMessage("Icon URL cannot exceed 200 characters")
                .When(x => !string.IsNullOrEmpty(x.IconUrl));
        }
    }
}
