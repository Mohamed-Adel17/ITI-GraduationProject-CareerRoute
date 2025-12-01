namespace CareerRoute.Core.Services.Interfaces;

public interface IAiClient
{
    Task<string> GetCompletionAsync(string systemPrompt, string userPrompt, CancellationToken ct = default);
}
