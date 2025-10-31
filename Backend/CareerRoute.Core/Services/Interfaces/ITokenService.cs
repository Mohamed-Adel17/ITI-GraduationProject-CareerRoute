using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CareerRoute.Core.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace CareerRoute.Core.Services.Interfaces
{
    public interface ITokenService
    {
        string GenerateJwtToken(ApplicationUser user, List<string> roles);
        string GenerateRefreshToken(ApplicationUser user); 

    }
}
