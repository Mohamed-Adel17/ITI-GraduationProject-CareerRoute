
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CareerRoute.Core.Domain.Entities
{
    public class Category
    {
        public int Id { get; set; }
        [MaxLength(50), Required]
        public required string Name { get; set; }
        [MaxLength(2000)]
        public string? Description { get; set; }
        [MaxLength(200)]
        public string? IconUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public virtual ICollection<MentorCategory> MentorCategories { get; set; } = new List<MentorCategory>();
    }
}
