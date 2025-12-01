using CareerRoute.Core.Domain.Entities;

namespace CareerRoute.Core.Domain.Interfaces
{
    public interface INotificationRepository : IBaseRepository<Notification>
    {
        Task<(List<Notification> Items, int TotalCount)> GetByUserIdAsync(string userId, int page, int pageSize);
        Task<int> GetUnreadCountAsync(string userId);
        Task MarkAsReadAsync(string notificationId, string userId);
        Task MarkAllAsReadAsync(string userId);

    }
}
