using CareerRoute.Core.DTOs.Users;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Interfaces
{
    internal interface IUserService
    {
        Task<RetriveUserDto>CreateUserWithRoleAsync(CreateUserDto cuDto);
    }
}
