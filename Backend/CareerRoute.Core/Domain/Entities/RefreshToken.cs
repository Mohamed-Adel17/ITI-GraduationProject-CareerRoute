using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Domain.Entities
{
    public class RefreshToken
    {
        [Key]
        public required string Token { get; set; }
        [Required]
        public required string UserId { get; set; }
        public virtual ApplicationUser? User { get; set; }

        public DateTime ExpiredDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RevokedAt { get; set; }

        [NotMapped]
        public bool IsRevoked => RevokedAt.HasValue;

        [NotMapped]
        public bool IsValid => DateTime.UtcNow < ExpiredDate && !IsRevoked;

    }
}
