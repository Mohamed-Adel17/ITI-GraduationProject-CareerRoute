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
            var existingCategoryNames = await context.Categories.AsNoTracking().Select(c => c.Name).ToListAsync();

            foreach (var categoryName in DefaultCategories)
            {


                if (!existingCategoryNames.Contains(categoryName))
                {
                    logger.LogInformation($"Creating category: {categoryName}");

                    var category = new Category
                    {
                        Name = categoryName,
                        CreatedAt = DateTime.UtcNow
                    };

                    await context.Categories.AddAsync(category);
                    await context.SaveChangesAsync();
                    logger.LogInformation($"Category '{categoryName}' created successfully.");
                }
                else
                {
                    logger.LogInformation($"Category '{categoryName}' already exists — skipping.");
                }
            }
            logger.LogInformation("Category seeding completed.");
        }
    }
}
