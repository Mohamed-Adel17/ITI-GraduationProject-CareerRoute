using CareerRoute.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CareerRoute.Infrastructure.Data.SeedData
{
    public static class SkillSeeder
    {
        private static readonly List<(string Name, string CategoryName)> DefaultSkills = new()
        {
            // IT Careers (15 skills)
            ("Career Shifting", "IT Careers"),
            ("Interview Preparation", "IT Careers"),
            ("Resume Building", "IT Careers"),
            ("Networking", "IT Careers"),
            ("Salary Negotiation", "IT Careers"),
            ("Personal Branding", "IT Careers"),
            ("Career Planning", "IT Careers"),
            ("React", "IT Careers"),
            ("Angular", "IT Careers"),
            ("Vue.js", "IT Careers"),
            ("Node.js", "IT Careers"),
            ("Python", "IT Careers"),
            ("Java", "IT Careers"),
            ("C#", "IT Careers"),
            ("JavaScript", "IT Careers"),
            ("TypeScript", "IT Careers"),
            ("AWS", "IT Careers"),
            ("Azure", "IT Careers"),
            ("DevOps", "IT Careers"),
            ("System Design", "IT Careers"),
            ("Docker", "IT Careers"),
            ("Kubernetes", "IT Careers"),

            // Leadership (8 skills)
            ("Team Management", "Leadership"),
            ("Project Management", "Leadership"),
            ("Strategic Planning", "Leadership"),
            ("Executive Coaching", "Leadership"),
            ("Change Management", "Leadership"),
            ("Decision Making", "Leadership"),
            ("Conflict Resolution", "Leadership"),
            ("Performance Management", "Leadership"),

            // Finance (6 skills)
            ("Financial Analysis", "Finance"),
            ("Investment Strategy", "Finance"),
            ("Accounting", "Finance"),
            ("Financial Planning", "Finance"),
            ("Risk Management", "Finance"),
            ("Portfolio Management", "Finance"),

            // Marketing (7 skills)
            ("Digital Marketing", "Marketing"),
            ("SEO", "Marketing"),
            ("Content Strategy", "Marketing"),
            ("Social Media Marketing", "Marketing"),
            ("Brand Management", "Marketing"),
            ("Email Marketing", "Marketing"),
            ("Sales Strategy", "Marketing"),

            // HR (5 skills)
            ("Recruitment", "HR"),
            ("Training & Development", "HR"),
            ("Culture Building", "HR"),
            ("HR Strategy", "HR"),
            ("Employee Relations", "HR"),

            // Design (6 skills)
            ("UX/UI Design", "Design"),
            ("Graphic Design", "Design"),
            ("Product Design", "Design"),
            ("User Research", "Design"),
            ("Prototyping", "Design"),
            ("Design Thinking", "Design")
        };

        public static async Task SeedSkillsAsync(ApplicationDbContext context, ILogger logger)
        {
            logger.LogInformation("Starting skill seeding...");

            // Fetch all categories and map by name
            var categories = await context.Categories
                .AsNoTracking()
                .ToDictionaryAsync(c => c.Name, c => c.Id, StringComparer.OrdinalIgnoreCase);

            if (categories.Count == 0)
            {
                logger.LogWarning("No categories found in database. Skills cannot be seeded without categories.");
                return;
            }

            logger.LogInformation("Found {Count} categories: {Names}", 
                categories.Count, 
                string.Join(", ", categories.Keys));

            // Fetch existing skill names (case-insensitive)
            var existingSkillNames = new HashSet<string>(
                await context.Skills
                    .AsNoTracking()
                    .Select(s => s.Name.ToLower())
                    .ToListAsync(),
                StringComparer.OrdinalIgnoreCase
            );

            // Filter only new skills and map to actual category IDs
            var newSkills = DefaultSkills
                .Where(skill => !existingSkillNames.Contains(skill.Name.ToLower()))
                .Where(skill => categories.ContainsKey(skill.CategoryName)) // Only add if category exists
                .Select(skill => new Skill
                {
                    Name = skill.Name,
                    CategoryId = categories[skill.CategoryName],
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                })
                .ToList();

            if (newSkills.Count == 0)
            {
                logger.LogInformation("No new skills to seed. All default skills already exist.");
                return;
            }

            await context.Skills.AddRangeAsync(newSkills);
            await context.SaveChangesAsync();

            logger.LogInformation("Seeded {Count} new skills: {Names}",
                newSkills.Count,
                string.Join(", ", newSkills.Take(10).Select(s => s.Name)) + (newSkills.Count > 10 ? "..." : ""));

            logger.LogInformation("Skill seeding completed successfully.");
        }
    }
}
