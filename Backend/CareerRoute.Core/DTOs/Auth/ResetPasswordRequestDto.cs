using CareerRoute.Core.Constants;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Auth
{
    public class ResetPasswordRequestDto
    {
        [RegularExpression(AppRegex.EmailPattern, ErrorMessage = AppErrorMessages.InvalidEmailFormat)]
        public required string Email { get; set; }

        [Required]
        public required string Token { get; set; }
        [Required]
        public required string NewPassword { get; set; }
    
        [Required]
        [Compare(nameof(NewPassword), ErrorMessage = AppErrorMessages.PasswordsNotMatch)]
        public required string ConfirmPassword { get; set; }
    }
}
