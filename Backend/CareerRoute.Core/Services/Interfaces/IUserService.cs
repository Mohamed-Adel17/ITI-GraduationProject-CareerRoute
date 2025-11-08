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
        public Task<IEnumerable<RetrieveUserDto>> GetAllUsersAsync();
        public Task<RetrieveUserDto> GetUserByIdAsync(string id);
        public Task<RetrieveUserDto> UpdateUserByIdAsync(string id, UpdateUserDto uuDto);
        public Task DeleteUserByIdAsync(string id);
    }
}
