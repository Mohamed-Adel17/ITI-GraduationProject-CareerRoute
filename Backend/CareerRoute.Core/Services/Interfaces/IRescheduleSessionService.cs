using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Interfaces
{
    /// <summary>
    /// Handles pending session reschedule requests (triggered from background jobs).
    /// </summary>
    public interface IRescheduleSessionService
    {
        Task HandlePendingRescheduleAsync(string rescheduleRequestId);
    }
}
