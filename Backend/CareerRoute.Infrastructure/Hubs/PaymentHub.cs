using Microsoft.AspNetCore.SignalR;

namespace CareerRoute.Infrastructure.Hubs
{
    public class PaymentHub : Hub
    {
        public async Task JoinGroup(string paymentIntentId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, paymentIntentId);
        }

        public async Task LeaveGroup(string paymentIntentId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, paymentIntentId);
        }
    }
}
