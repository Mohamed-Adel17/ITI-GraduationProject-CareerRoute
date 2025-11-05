using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.Mentors;
using CareerRoute.Core.DTOs.Users;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Validators.Users;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;



namespace CareerRoute.Core.Services.Implementations
{
    public class UserService :  IUserService
    {
        //private readonly IUserRepository userRepository;
        private readonly IMapper mapper;
        private readonly UserManager<ApplicationUser> userManager;
        private readonly RoleManager<IdentityRole> roleManager;
        private readonly IValidator<UpdateUserDto> updateValidator;


        public UserService(IMapper mapper , 
            UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager,
             IValidator<UpdateUserDto> updateValidator) {

            //this.userRepository = userRepository;
            this.mapper = mapper;
            this.userManager = userManager;
            this.roleManager = roleManager;
            this.updateValidator = updateValidator;
        }
      
        public async Task<IEnumerable<RetriveUserDto>> GetAllUsersAsync()
        {
            //retrieve users using manager not pure repository

            var users = await userManager.Users.ToListAsync();
            return mapper.Map<IEnumerable<RetriveUserDto>>(users);
        }


        public async Task<RetriveUserDto> GetUserByIdAsync (string id )
        {
            //retrieve users using manager not pure repository

            var user = await userManager.FindByIdAsync(id);
            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }
            return mapper.Map<RetriveUserDto>(user);
        }

        public async Task<RetriveUserDto> UpdateUserByIdAsync(string id , UpdateUserDto uuDto)
        {
            var validationResult = await updateValidator.ValidateAsync(uuDto);

            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

                throw new ValidationException("Validation failed", errors.Select(e =>
                    new FluentValidation.Results.ValidationFailure(e.Key, string.Join("; ", e.Value))));
            }

            var user = await userManager.FindByIdAsync(id);
            if (user == null)
                throw new KeyNotFoundException("User not found");

            mapper.Map(uuDto, user);

            var result = await userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new Exception($"Update failed: {errors}");
            }

            return mapper.Map<RetriveUserDto>(user);
        }


        public async Task DeleteUserByIdAsync(string id)
        {
            //delete user using manager not pure repository

            var user = await userManager.FindByIdAsync(id);
            if (user == null)
                throw new KeyNotFoundException("User not found");

            var result = await userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new Exception($"Delete failed: {errors}");
            }

        }



    }
}
