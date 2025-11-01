using CareerRoute.Core.Constants;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Auth
{
    public class EmailRequestDto
    {
        [RegularExpression(AppRegex.EmailPattern, ErrorMessage = AppErrorMessages.InvalidEmailFormat)]
        public required string Email { get; set; }
    }
}
