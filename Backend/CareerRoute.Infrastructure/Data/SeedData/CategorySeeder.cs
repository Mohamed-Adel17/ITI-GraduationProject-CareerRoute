using CareerRoute.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;



namespace CareerRoute.Infrastructure.Data.SeedData
{
    public static class CategorySeeder
    {

        private static readonly List<string> DefaultCategories = new()
        {
            "IT Careers",
            "Leadership",
            "Finance",
            "Marketing",
            "HR",
            "Design",
            "Startup Advice"
        };

        public static async Task SeedCategoriesAsync(ApplicationDbContext context, ILogger logger)
        {
            logger.LogInformation("Starting category seeding...");

            // Fetch existing category names once, in lowercase for case-insensitive comparison
            var existingCategoryNames = new HashSet<string>(
                await context.Categories
                    .AsNoTracking()
                    .Select(c => c.Name.ToLower())
                    .ToListAsync(),
                    StringComparer.OrdinalIgnoreCase
            );

            // Filter only new categories
            var newCategories = DefaultCategories
                .Where(name => !existingCategoryNames.Contains(name))
                .Select(name => new Category
                {
                    Name = name,
                    CreatedAt = DateTime.UtcNow
                })
                .ToList();

            if (newCategories.Count == 0)
            {
                logger.LogInformation("No new categories to seed. All default categories already exist.");
                return;
            }

            await context.Categories.AddRangeAsync(newCategories);
            await context.SaveChangesAsync();

            logger.LogInformation("Seeded {Count} new categories: {Names}",
                newCategories.Count,
                string.Join(", ", newCategories.Select(c => c.Name)));

            logger.LogInformation("Category seeding completed successfully.");
        }

    }
}
