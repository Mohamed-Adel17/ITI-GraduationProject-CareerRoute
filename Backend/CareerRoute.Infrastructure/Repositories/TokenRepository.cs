using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Infrastructure.Repositories
{
    public class TokenRepository(ApplicationDbContext dbContext) : ITokenRepository
    {
        public async Task AddAsync(RefreshToken refreshToken)
        {
            await dbContext.RefreshTokens.AddAsync(refreshToken);
        }

        public async Task<RefreshToken?> GetByTokenAsync(string token)
        {
            return await dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == token);
        }

        public async Task RevokeAllUserTokensAsync(string userId)
        {
            await dbContext.RefreshTokens.
                Include(rt => rt.User)
                .Where(rt => rt.UserId == userId && !rt.RevokedAt.HasValue && rt.ExpiredDate > DateTime.UtcNow)
                .ExecuteUpdateAsync(rt => rt
                    .SetProperty(r => r.RevokedAt, DateTime.UtcNow)
                );
        }

        public async Task RevokeAsync(string token)
        {
            var refreshToken = await dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == token);
            if (refreshToken is null) return;
            refreshToken.RevokedAt = DateTime.UtcNow;
        }
        public async Task<int> SaveChangesAsync()
        {
            return await dbContext.SaveChangesAsync();
        }
    }
}
