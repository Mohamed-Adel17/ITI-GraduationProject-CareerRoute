namespace CareerRoute.Core.DTOs.Skills
{
    public class UpdateSkillDto
    {
        public string? Name { get; set; }
        public int? CategoryId { get; set; }
        public bool? IsActive { get; set; }
    }
}
