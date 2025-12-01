
namespace CareerRoute.Core.Domain.Entities
{
    public class MentorCategory
    {
        public required string MentorId { get; set; }
        public required int CategoryId { get; set; }
        public virtual Mentor Mentor { get; set; } = null!;
        public virtual Category Category { get; set; } = null!;
    }
}
