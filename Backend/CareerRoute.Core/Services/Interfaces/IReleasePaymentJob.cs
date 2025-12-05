using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Interfaces
{
    public interface IReleasePaymentJob
    {
        Task ExecuteAsync(string sessionId);
    }
}
