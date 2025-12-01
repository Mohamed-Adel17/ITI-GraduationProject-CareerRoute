using System;
using System.ComponentModel.DataAnnotations;

namespace CareerRoute.Core.Domain.Entities
{
    public class UserSkill
    {
        [MaxLength(450), Required]
        public required string UserId { get; set; }
        
        public int SkillId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual ApplicationUser User { get; set; } = null!;
        public virtual Skill Skill { get; set; } = null!;
    }
}
