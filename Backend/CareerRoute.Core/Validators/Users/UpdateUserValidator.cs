using CareerRoute.Core.DTOs.Users;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Validators.Users
{
    public class UpdateUserValidator : AbstractValidator<UpdateUserDto>
    {

        public UpdateUserValidator()
        {
            //all fields accept null

            RuleFor(uuDto => uuDto.FirstName)
             .MinimumLength(2).WithMessage("First Name must be at least 2 characters long")
             .MaximumLength(50).WithMessage("First Name must not exceed 50 characters")
             .When(x => !string.IsNullOrEmpty(x.FirstName));
            
            RuleFor(uuDto => uuDto.LastName)
                .MinimumLength(2).WithMessage("Last Name must be at least 2 characters long")
                .MaximumLength(50).WithMessage("Last Name must not exceed 50 characters")
                .When(x => !string.IsNullOrEmpty(x.LastName));

            RuleFor(uuDto => uuDto.PhoneNumber)
                .Matches(@"^\+?[0-9]{10,15}$").WithMessage("Phone number must be valid and contain 10–15 digits")
                .When(x => !string.IsNullOrEmpty(x.PhoneNumber));

            RuleFor(uuDto => uuDto.ProfilePictureUrl)
                    .MaximumLength(200).WithMessage("Uploaded url must not exceed 200 char long")
                    .Matches(@"\.(jpg|jpeg|png)$").WithMessage("Profile picture URL must point to an image file (.jpg, .jpeg, .png)")
                    .When(x => !string.IsNullOrEmpty(x.ProfilePictureUrl));


            RuleFor(uuDto => uuDto.CareerGoal)
                  .MaximumLength(500).WithMessage("Career Goal must not exceed 500 char long")
                  .When(x => !string.IsNullOrEmpty(x.CareerGoal));


            RuleFor(uuDto => uuDto.CareerInterestIds)
                .Must(ids => ids == null || ids.All(id => id > 0))
                    .WithMessage("All career interest IDs must be greater than 0")
                .When(x => x.CareerInterestIds != null);



        }
    }
}
