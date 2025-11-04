using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.DTOs.Auth
{
    public class TokenRequestDto
    {
        public string RefreshToken { get; set; } = string.Empty;
    }
}
