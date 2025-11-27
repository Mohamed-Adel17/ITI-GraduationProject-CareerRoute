namespace CareerRoute.Core.Services.Interfaces;

public interface IAiSummaryService
{
    Task GenerateAndStoreSummaryAsync(string sessionId, CancellationToken ct = default);
}
