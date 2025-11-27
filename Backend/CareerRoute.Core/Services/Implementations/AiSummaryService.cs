using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.Prompts;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace CareerRoute.Core.Services.Implementations;

public class AiSummaryService : IAiSummaryService
{
    private readonly ISessionRepository _sessionRepository;
    private readonly IAiClient _aiClient;
    private readonly ILogger<AiSummaryService> _logger;

    public AiSummaryService(
        ISessionRepository sessionRepository,
        IAiClient aiClient,
        ILogger<AiSummaryService> logger)
    {
        _sessionRepository = sessionRepository;
        _aiClient = aiClient;
        _logger = logger;
    }

    public async Task GenerateAndStoreSummaryAsync(string sessionId, CancellationToken ct = default)
    {
        var session = await _sessionRepository.GetByIdWithRelationsAsync(sessionId);
        if (session is null)
        {
            _logger.LogWarning("Session {SessionId} not found for AI summary generation", sessionId);
            return;
        }

        if (string.IsNullOrEmpty(session.Transcript))
        {
            _logger.LogWarning("Session {SessionId} has no transcript for AI summary generation", sessionId);
            return;
        }

        if (!string.IsNullOrEmpty(session.Summary))
        {
            _logger.LogInformation("Session {SessionId} already has a summary, skipping", sessionId);
            return;
        }

        try
        {
            _logger.LogInformation("Generating AI summary for session {SessionId}", sessionId);

            var userPrompt = BuildEnrichedPrompt(session);
            
            var summary = await _aiClient.GetCompletionAsync(
                SessionAnalystPrompt.SystemPrompt,
                userPrompt,
                ct);

            session.Summary = summary;
            _sessionRepository.Update(session);
            await _sessionRepository.SaveChangesAsync();

            _logger.LogInformation("AI summary generated and stored for session {SessionId}", sessionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate AI summary for session {SessionId}", sessionId);
        }
    }

    private static string BuildEnrichedPrompt(Session session)
    {
        var mentorName = session.Mentor?.User?.FullName ?? "Unknown Mentor";
        var menteeName = session.Mentee?.FullName ?? "Unknown Mentee";
        var expertise = session.Mentor?.ExpertiseTags ?? "Not specified";
        var topic = session.Topic ?? "General mentorship session";
        var duration = (int)session.Duration;
        var scheduledDate = session.ScheduledStartTime.ToString("MMMM dd, yyyy 'at' HH:mm 'UTC'");

        return $"""
            **SESSION METADATA:**
            - Mentor: {mentorName}
            - Mentee: {menteeName}
            - Mentor Expertise: {expertise}
            - Session Topic: {topic}
            - Scheduled Duration: {duration} minutes
            - Session Date: {scheduledDate}

            **TRANSCRIPT:**
            {session.Transcript}
            """;
    }
}
