using CareerRoute.Core.DTOs.Users;
using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Validators.Users
{
    internal class CreateUserValidator : AbstractValidator<CreateUserDto>
    {
    
        //add rules with a customized message for validations on input of CreateUserDto before reaching the controller 
        //it does not throw exception => it is not catched by the Exception middleware 
        public CreateUserValidator()
        {
            RuleFor(cuDto => cuDto.UserName)
                .NotEmpty().WithMessage("User Name is required");

            RuleFor(cuDto => cuDto.FirstName)
             .NotEmpty().WithMessage("First Name is required")
                             .MaximumLength(50).WithMessage("First Name length must not exceed 50 char long ");


            RuleFor(cuDto => cuDto.LastName)
                         .NotEmpty().WithMessage("Last Name is required")
                         .MaximumLength(50).WithMessage("First Name length must not exceed 50 char long ");


            RuleFor(cuDto => cuDto.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Email format is invalid");

            RuleFor(cuDto => cuDto.Password)
           .NotEmpty().WithMessage("Password is required")
           .MinimumLength(8).WithMessage("Password must be at least 8 char long");

            RuleFor(cuDto => cuDto.PhoneNumber)
            .Matches(@"^\+?[0-9]{10,15}$").WithMessage("Phone number must be valid and contain 10–15 digits");

            RuleFor(cuDto => cuDto.ProfilePictureUrl)
                .MaximumLength(200).WithMessage("Uploaded url must not exceed 200 char long")
                .Matches(@"\.(jpg|jpeg|png)$").WithMessage("Profile picture URL must point to an image file (.jpg, .jpeg, .png)");

            RuleFor(cuDto => cuDto.CareerGoal)
                .NotEmpty().WithMessage("Career Goal is required")
              .MaximumLength(200).WithMessage("Career Goal must not exceed 200 char long");


            RuleFor(cuDto => cuDto.CareerInterst)
               .NotEmpty().WithMessage("Career Interst is required")
             .MaximumLength(200).WithMessage("Career Goal must not exceed 200 char long");

        }

    }
}
