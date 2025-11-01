using CareerRoute.Core.Constants;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Auth
{
    public class ChangePasswordRequestDto
    {
        [Required]
        public required string CurrentPassword { get; set; }
        [Required]
        public required string NewPassword { get; set; }
        [Required]
        [Compare(nameof(NewPassword), ErrorMessage = AppErrorMessages.PasswordsNotMatch)]

        public required string ConfirmPassword { get; set; }
    }
}
