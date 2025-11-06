using CareerRoute.Core.Constants;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Setting;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Implementations
{
    public class TokenService(IOptions<JwtSettings> jwtSettings) : ITokenService

    {
        private readonly IOptions<JwtSettings> _jwtSettings = jwtSettings;
        public string GenerateJwtToken(ApplicationUser user, List<string> roles)
        {
            List<Claim> claims = [
                        new (JwtRegisteredClaimNames.Sub ,user.Id),
                        new (JwtRegisteredClaimNames.Email ,user.Email!),
                        new (JwtRegisteredClaimNames.Iat, DateTime.UtcNow.ToString()),
                        new (JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            // OpenID Connect claims
                        new Claim("given_name", user.FirstName ?? ""),
                        new Claim("family_name", user.LastName ?? ""),
                        new Claim("email_verified", user.EmailConfirmed.ToString().ToLowerInvariant()),
                        new Claim("picture", user.ProfilePictureUrl ?? ""),
            // Custom claims
                        new Claim("is_mentor",roles.Contains(AppRoles.Mentor).ToString().ToLowerInvariant() ),
            ];

            //var roles = await userManager.GetRolesAsync(user);
            claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Value.SecretKey));
            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Issuer = _jwtSettings.Value.Issuer,
                Audience = _jwtSettings.Value.Audience,
                Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.Value.AccessTokenExpirationMinutes),
                SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256),
                Subject = new ClaimsIdentity(claims)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public string GenerateRefreshToken(ApplicationUser user)
        {
            var randomBytes = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            var token = Convert.ToBase64String(randomBytes);
            //await context.RefreshTokens.AddAsync(new RefreshToken
            //{
            //    Token = token,
            //    UserId = userId,
            //    CreatedAt = DateTime.UtcNow,
            //    ExpiredDate = DateTime.UtcNow.AddDays(7),
            //});
            //await context.SaveChangesAsync();

            return token;
        }
    }
}
