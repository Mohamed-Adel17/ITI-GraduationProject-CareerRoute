using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.Notifications;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace CareerRoute.Infrastructure.Services
{
    /// <summary>
    /// Service for managing user notifications including persistence and real-time delivery via SignalR.
    /// </summary>
    public class SignalRNotificationService : ISignalRNotificationService
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly IMapper _mapper;
        public SignalRNotificationService(
            INotificationRepository notificationRepository,
            IHubContext<NotificationHub> hubContext,
            IMapper mapper)
        {
            _notificationRepository = notificationRepository;
            _hubContext = hubContext;
            _mapper = mapper;
        }

        public async Task SendNotificationAsync(string userId, NotificationType type, string title, string message, string? actionUrl = null)
        {
            var notification = new Notification
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                Type = type,
                Title = title,
                Message = message,
                ActionUrl = actionUrl,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.AddAsync(notification);
            await _notificationRepository.SaveChangesAsync();

            var notificationDto = _mapper.Map<NotificationDto>(notification);

            await _hubContext.Clients
                .Group($"user_{userId}")
                .SendAsync("ReceiveNotification", notificationDto);
        }

    }
}