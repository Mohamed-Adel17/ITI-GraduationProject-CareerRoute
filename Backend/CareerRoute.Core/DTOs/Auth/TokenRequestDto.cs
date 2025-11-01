using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Auth
{
    public class TokenRequestDto
    {
        public required string RefreshToken { get; set; } 
    }
}
