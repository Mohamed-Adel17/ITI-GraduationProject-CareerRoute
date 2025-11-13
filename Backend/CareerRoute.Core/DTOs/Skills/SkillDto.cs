namespace CareerRoute.Core.DTOs.Skills
{
    public class SkillDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }
}
