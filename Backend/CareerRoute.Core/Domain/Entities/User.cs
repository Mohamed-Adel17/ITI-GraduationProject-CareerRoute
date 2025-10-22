using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace CareerRoute.Core.Domain.Entities
{
    public class ApplicationUser : IdentityUser
    {
        [MaxLength(50), Required]
        public required string FirstName { get; set; }
        [MaxLength(50), Required]
        public required string LastName { get; set; }
        public string FullName => $"{FirstName} {LastName}";

        [MaxLength(200)]
        public string? ProfilePictureUrl { get; set; }
        public DateTime RegistrationDate { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginDate { get; set; }
        public bool IsActive { get; set; } = true;
        public virtual List<RefreshToken> RefreshTokens { get; set; } = [];



    }
}
