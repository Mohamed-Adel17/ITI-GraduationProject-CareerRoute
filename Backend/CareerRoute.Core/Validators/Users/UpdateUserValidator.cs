using CareerRoute.Core.DTOs.Users;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Validators.Users
{
    internal class UpdateUserValidator : AbstractValidator<UpdateUserDto>
    {

        public UpdateUserValidator()
        {
            //all accepts null

            RuleFor(uuDto => uuDto.FirstName)
             .MaximumLength(50).WithMessage("First Name length must not exceed 50 char long ")
             .When(x => !string.IsNullOrEmpty(x.FirstName));
            


            RuleFor(uuDto => uuDto.LastName)
                .MaximumLength(50).WithMessage("First Name length must not exceed 50 char long ")
                .When(x => !string.IsNullOrEmpty(x.LastName));



            RuleFor(uuDto => uuDto.Email)
                    .EmailAddress().WithMessage("Email format is invalid")
                    .When(x => !string.IsNullOrEmpty(x.Email));



            RuleFor(uuDto => uuDto.PhoneNumber)
                .Matches(@"^\+?[0-9]{10,15}$").WithMessage("Phone number must be valid and contain 10–15 digits")
                .When(x => !string.IsNullOrEmpty(x.PhoneNumber));

            RuleFor(uuDto => uuDto.ProfilePictureUrl)
                    .MaximumLength(200).WithMessage("Uploaded url must not exceed 200 char long")
                    .Matches(@"\.(jpg|jpeg|png)$").WithMessage("Profile picture URL must point to an image file (.jpg, .jpeg, .png)")
                    .When(x => !string.IsNullOrEmpty(x.ProfilePictureUrl));


            RuleFor(uuDto => uuDto.CareerGoal)
                  .MaximumLength(200).WithMessage("Career Goal must not exceed 200 char long")
                  .When(x => !string.IsNullOrEmpty(x.CareerGoal));


            RuleFor(uuDto => uuDto.CareerInterst)
                 .MaximumLength(200).WithMessage("Career Goal must not exceed 200 char long")
                 .When(x => !string.IsNullOrEmpty(x.CareerInterst));



        }
    }
}
