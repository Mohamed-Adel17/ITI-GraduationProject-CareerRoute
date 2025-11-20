using CareerRoute.API.Hubs;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace CareerRoute.API.Services
{
    public class SignalRPaymentNotificationService : IPaymentNotificationService
    {
        private readonly IHubContext<PaymentHub> _hubContext;

        public SignalRPaymentNotificationService(IHubContext<PaymentHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task NotifyPaymentStatusAsync(string paymentIntentId, PaymentStatusOptions status)
        {
            await _hubContext.Clients.Group(paymentIntentId).SendAsync("ReceivePaymentStatus", status.ToString());
        }
    }
}
