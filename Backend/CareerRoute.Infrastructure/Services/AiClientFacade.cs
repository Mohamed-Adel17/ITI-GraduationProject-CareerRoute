using CareerRoute.Core.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace CareerRoute.Infrastructure.Services;

public class AiClientFacade : IAiClient
{
    private readonly OpenAiClient _openAi;
    private readonly GitHubModelsClient _gitHub;
    private readonly ILogger<AiClientFacade> _logger;

    public AiClientFacade(OpenAiClient openAi, GitHubModelsClient gitHub, ILogger<AiClientFacade> logger)
    {
        _openAi = openAi;
        _gitHub = gitHub;
        _logger = logger;
    }

    public async Task<string> GetCompletionAsync(string systemPrompt, string userPrompt, CancellationToken ct = default)
    {
        try
        {
            _logger.LogInformation("Attempting OpenAI for completion...");
            return await _openAi.GetCompletionAsync(systemPrompt, userPrompt, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "OpenAI failed, falling back to GitHub Models");
        }

        return await _gitHub.GetCompletionAsync(systemPrompt, userPrompt, ct);
    }
}
