using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CareerRoute.Infrastructure.Repositories
{
    public class NotificationRepository : GenericRepository<Notification>, INotificationRepository
    {
        public NotificationRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }

      
        public async Task<(List<Notification> Items, int TotalCount)> GetByUserIdAsync(string userId, int page, int pageSize)
        {
            var query = dbContext.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt);

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            return await dbContext.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }

        public async Task MarkAsReadAsync(string notificationId, string userId)
        {
            var notification = await dbContext.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification != null)
            {
                notification.IsRead = true;
            }
        }

        public async Task MarkAllAsReadAsync(string userId)
        {
            await dbContext.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ForEachAsync(n => n.IsRead = true);
            //.ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
        }


    }
}
