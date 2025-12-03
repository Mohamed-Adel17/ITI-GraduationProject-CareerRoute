using CareerRoute.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CareerRoute.Infrastructure.Data.SeedData
{
    /// <summary>
    /// Seeds MentorBalance records for all existing mentors that don't have one yet.
    /// This ensures every mentor has a balance record initialized with zero values.
    /// </summary>
    public static class MentorBalanceSeeder
    {
        public static async Task SeedMentorBalancesAsync(ApplicationDbContext context, ILogger logger)
        {
            logger.LogInformation("Starting mentor balance seeding...");

            // Get all mentor IDs that don't have a balance record yet
            var mentorIdsWithoutBalance = await context.Mentors
                .AsNoTracking()
                .Where(m => !context.MentorBalances.Any(mb => mb.MentorId == m.Id))
                .Select(m => m.Id)
                .ToListAsync();

            if (mentorIdsWithoutBalance.Count == 0)
            {
                logger.LogInformation("No new mentor balances to seed. All mentors already have balance records.");
                return;
            }

            // Create balance records for mentors without one
            var newBalances = mentorIdsWithoutBalance
                .Select(mentorId => new MentorBalance
                {
                    MentorId = mentorId,
                    AvailableBalance = 0,
                    PendingBalance = 0,
                    TotalEarnings = 0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                })
                .ToList();

            await context.MentorBalances.AddRangeAsync(newBalances);
            await context.SaveChangesAsync();

            logger.LogInformation("Seeded {Count} new mentor balance records.", newBalances.Count);
            logger.LogInformation("Mentor balance seeding completed successfully.");
        }
    }
}
