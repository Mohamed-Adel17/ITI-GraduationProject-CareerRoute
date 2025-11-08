using CareerRoute.Core.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Domain.Interfaces
{
    public interface ITokenRepository
    {
        Task<RefreshToken?> GetByTokenAsync(string token);
        Task AddAsync(RefreshToken refreshToken);
        Task RevokeAsync(string token);
        Task RevokeAllUserTokensAsync(string userId);
        Task<int> SaveChangesAsync();


    }
}
