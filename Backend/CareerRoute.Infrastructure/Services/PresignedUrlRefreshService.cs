using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CareerRoute.Infrastructure.Services
{
    public class PresignedUrlRefreshService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<PresignedUrlRefreshService> _logger;
        private const int UrlValidityDays = 7;

        public PresignedUrlRefreshService(
            IServiceScopeFactory scopeFactory,
            ILogger<PresignedUrlRefreshService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        public async Task RefreshExpiringUrlsAsync()
        {
            using var scope = _scopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var blobService = scope.ServiceProvider.GetRequiredService<IBlobStorageService>();

            var threshold = DateTime.UtcNow.AddDays(1); // Refresh URLs expiring within 1 day

            // Refresh User profile pictures
            var usersToUpdate = await dbContext.Users
                .Where(u => u.ProfilePictureStorageKey != null && 
                           (u.ProfilePictureUrlExpiry == null || u.ProfilePictureUrlExpiry < threshold))
                .ToListAsync();

            foreach (var user in usersToUpdate)
            {
                try
                {
                    user.ProfilePictureUrl = await blobService.GetPresignedUrlAsync(user.ProfilePictureStorageKey!);
                    user.ProfilePictureUrlExpiry = DateTime.UtcNow.AddDays(UrlValidityDays);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to refresh profile picture URL for user {UserId}", user.Id);
                }
            }

            // Refresh Mentor CVs
            var mentorsToUpdate = await dbContext.Mentors
                .Where(m => m.CvStorageKey != null && 
                           (m.CvUrlExpiry == null || m.CvUrlExpiry < threshold))
                .ToListAsync();

            foreach (var mentor in mentorsToUpdate)
            {
                try
                {
                    mentor.CvUrl = await blobService.GetPresignedUrlAsync(mentor.CvStorageKey!);
                    mentor.CvUrlExpiry = DateTime.UtcNow.AddDays(UrlValidityDays);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to refresh CV URL for mentor {MentorId}", mentor.Id);
                }
            }

            await dbContext.SaveChangesAsync();

            _logger.LogInformation("Refreshed {UserCount} profile pictures and {MentorCount} CVs", 
                usersToUpdate.Count, mentorsToUpdate.Count);
        }
    }
}
