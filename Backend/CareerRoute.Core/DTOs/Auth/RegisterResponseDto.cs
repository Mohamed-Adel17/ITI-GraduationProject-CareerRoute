using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Auth
{
    public class RegisterResponseDto
    {
        public required string UserId { get; set; }
        public required string Message { get; set; }
        public required string Email { get; set; }
        public required bool Success { get; set; }
        public required bool RequiresEmailVerification { get; set; }
    }
}
