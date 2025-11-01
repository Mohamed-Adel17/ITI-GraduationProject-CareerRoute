using CareerRoute.Core.Constants;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Auth
{
    public class RegisterRequestDto
    {
        [Required]
        [RegularExpression(AppRegex.EmailPattern, ErrorMessage = AppErrorMessages.InvalidEmailFormat)]
        public required string Email { get; set; }
        [Required]
        public required string Password { get; set; }
        [Required]
        [Compare(nameof(Password), ErrorMessage = AppErrorMessages.PasswordsNotMatch)]
        public required string ConfirmPassword { get; set; }
        [Required]
        public required string FirstName { get; set; }
        [Required]
        public required string LastName { get; set; }
        [Phone]
        public  string? PhoneNumber { get; set; }

        public bool RegisterAsMentor { get; set; } = false;


    }
}
