using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CareerRoute.Core.Domain.Entities
{
    public class PreviousWork
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string MentorId { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string CompanyName { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string JobTitle { get; set; } = string.Empty;

        public DateTime StartDate { get; set; }

        public DateTime? EndDate { get; set; }

        [MaxLength(1000)]
        public string? Description { get; set; }

        [ForeignKey(nameof(MentorId))]
        public virtual Mentor Mentor { get; set; } = null!;
    }
}
