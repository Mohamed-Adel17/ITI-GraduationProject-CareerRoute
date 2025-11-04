using CareerRoute.Core.DTOs.Users;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Interfaces
{
    public interface IUserService
    {
        public Task<RetriveUserDto>CreateUserWithRoleAsync(CreateUserDto cuDto);
        public Task<IEnumerable<RetriveUserDto>> GetAllUsersAsync();

    }
}
