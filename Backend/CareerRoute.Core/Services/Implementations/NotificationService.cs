using AutoMapper;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs;
using CareerRoute.Core.DTOs.Notifications;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Services.Interfaces;

namespace CareerRoute.Core.Services.Implementations
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IMapper _mapper;
        public NotificationService(
            INotificationRepository notificationRepository,
            IMapper mapper)
        {
            _notificationRepository = notificationRepository;
            _mapper = mapper;
        }
        public async Task<NotificationListResponseDto> GetUserNotificationsAsync(string userId, int page, int pageSize)
        {
            var (items, totalCount) = await _notificationRepository.GetByUserIdAsync(userId, page, pageSize);

            var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
            var notificationsDto = _mapper.Map<List<NotificationDto>>(items);

            return new NotificationListResponseDto
            {
                Items = notificationsDto,
                Pagination = new PaginationMetadataDto
                {
                    TotalCount = totalCount,
                    CurrentPage = page,
                    PageSize = pageSize,
                    TotalPages = totalPages,
                    HasNextPage = page < totalPages,
                    HasPreviousPage = page > 1
                }
            };
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            return await _notificationRepository.GetUnreadCountAsync(userId);
        }

        public async Task MarkAsReadAsync(string notificationId, string userId)
        {
            var existingNotification=await _notificationRepository.GetByIdAsync(notificationId);
            if (existingNotification is null)
                throw new NotFoundException("Not Found Notification");
            await _notificationRepository.MarkAsReadAsync(notificationId, userId);
            await _notificationRepository.SaveChangesAsync();
        }

        public async Task MarkAllAsReadAsync(string userId)
        {
            await _notificationRepository.MarkAllAsReadAsync(userId);
            await _notificationRepository.SaveChangesAsync();
        }
    }
}
