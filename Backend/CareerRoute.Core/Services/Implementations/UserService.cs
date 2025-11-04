using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.Mentors;
using CareerRoute.Core.DTOs.Users;
using CareerRoute.Core.Services.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Implementations
{
    public class UserService :  IUserService
    {
        //private readonly IUserRepository userRepository;
        private readonly IMapper mapper;
        private readonly UserManager<ApplicationUser> userManager;
        private readonly RoleManager<IdentityRole> roleManager;
        private readonly IValidator<CreateUserDto> createValidator;

        public UserService(IMapper mapper , 
            UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager,
            IValidator<CreateUserDto> createValidator ) {

            //this.userRepository = userRepository;
            this.mapper = mapper;
            this.userManager = userManager;
            this.roleManager = roleManager;
            this.createValidator = createValidator;
        }
        public async Task<RetriveUserDto> CreateUserWithRoleAsync(CreateUserDto cuDto)
        {
            var validationResult = await createValidator.ValidateAsync(cuDto);

            if (!validationResult.IsValid)
            {
                // Collect all validation messages into one readable string
                var errors = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage));
                throw new ValidationException($"validation failed: {errors}");
            }

            var user = mapper.Map<ApplicationUser>(cuDto);

            //create user using identity not pure repository 
            var result = await userManager.CreateAsync(user, cuDto.Password);

            if (!result.Succeeded)
            {
                throw new Exception($"User creation failed");
            }

            //Ensure the role exists (if not, create it)
            if (!await roleManager.RoleExistsAsync(cuDto.Role))
            {
                await roleManager.CreateAsync(new IdentityRole(cuDto.Role));
            }

            //Assign user to role
            await userManager.AddToRoleAsync(user, cuDto.Role);

            var retrivedUser = mapper.Map<RetriveUserDto>(user);
            return retrivedUser;
        }

        public async Task<IEnumerable<RetriveUserDto>> GetAllUsersAsync()
        {
            //retrieve users using manager not pure repository

            var users = userManager.Users.ToList();
            return mapper.Map<IEnumerable<RetriveUserDto>>(users);
        }


        public async Task<RetriveUserDto> GetUserByIdAsync (string id )
        {
            //retrieve users using manager not pure repository

            var user = userManager.FindByIdAsync(id);
            return mapper.Map<RetriveUserDto>(user);
        }
         
    }
}
