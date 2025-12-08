using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CareerRoute.Infrastructure.Services
{
    /// <summary>
    /// Background timer that retries transcript retrieval for sessions where transcript is unavailable
    /// Runs every 30 minutes and retries for up to 24 hours (48 attempts)
    /// </summary>
    public class TranscriptRetryTimer : IDisposable
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<TranscriptRetryTimer> _logger;
        private Timer? _timer;
        private bool _disposed;

        // Configuration
        private const int IntervalMinutes = 30;
        private const int MaxRetryHours = 24;
        private const int MaxRetryAttempts = MaxRetryHours * 60 / IntervalMinutes; // 48 attempts

        public TranscriptRetryTimer(
            IServiceProvider serviceProvider,
            ILogger<TranscriptRetryTimer> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        /// <summary>
        /// Starts the transcript retry timer
        /// </summary>
        public void Start()
        {
            _logger.LogInformation(
                "Starting TranscriptRetryTimer. Interval: {Interval} minutes, Max attempts: {MaxAttempts}",
                IntervalMinutes, MaxRetryAttempts);

            // Start timer with initial delay of 5 minutes, then run every 30 minutes
            _timer = new Timer(
                async _ => await ExecuteAsync(),
                null,
                TimeSpan.FromMinutes(5),
                TimeSpan.FromMinutes(IntervalMinutes));
        }

        /// <summary>
        /// Executes the transcript retry logic
        /// </summary>
        private async Task ExecuteAsync()
        {
            try
            {
                _logger.LogInformation(
                    "[AUDIT] TranscriptRetryTimer execution started. Timestamp: {Timestamp}",
                    DateTime.UtcNow);

                using var scope = _serviceProvider.CreateScope();
                var sessionRepository = scope.ServiceProvider.GetRequiredService<IBaseRepository<Session>>();
                var zoomService = scope.ServiceProvider.GetRequiredService<IZoomService>();
                var deepgramService = scope.ServiceProvider.GetRequiredService<IDeepgramService>();

                // Find sessions that need transcript retry:
                // 1. Recording is processed (recording.completed webhook received)
                // 2. Transcript is not processed yet
                // 3. Has not exceeded max retry attempts
                // 4. Either never attempted OR last attempt was more than 30 minutes ago
                var sessions = await sessionRepository.GetAllAsync();
                var sessionsNeedingRetry = sessions.Where(s =>
                    s.RecordingProcessed &&
                    !s.TranscriptProcessed &&
                    !string.IsNullOrEmpty(s.VideoStorageKey) && // Ensure we have the file in R2
                    s.TranscriptRetrievalAttempts < MaxRetryAttempts &&
                    (!s.LastTranscriptRetrievalAttempt.HasValue ||
                     DateTime.UtcNow - s.LastTranscriptRetrievalAttempt.Value >= TimeSpan.FromMinutes(IntervalMinutes))
                ).ToList();

                if (!sessionsNeedingRetry.Any())
                {
                    _logger.LogInformation(
                        "[AUDIT] No sessions requiring transcript retry. Timestamp: {Timestamp}",
                        DateTime.UtcNow);
                    return;
                }

                _logger.LogInformation(
                    "[AUDIT] Found {Count} sessions requiring transcript retry. Timestamp: {Timestamp}",
                    sessionsNeedingRetry.Count, DateTime.UtcNow);

                // We need IBlobStorageService to generate presigned URLs
                var blobStorageService = scope.ServiceProvider.GetRequiredService<IBlobStorageService>();

                foreach (var session in sessionsNeedingRetry)
                {
                    await RetryTranscriptRetrievalAsync(session, sessionRepository, blobStorageService, deepgramService);
                }

                _logger.LogInformation(
                    "[AUDIT] TranscriptRetryTimer execution completed. Processed {Count} sessions. Timestamp: {Timestamp}",
                    sessionsNeedingRetry.Count, DateTime.UtcNow);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "[AUDIT] Error in TranscriptRetryTimer execution. Timestamp: {Timestamp}",
                    DateTime.UtcNow);
            }
        }

        /// <summary>
        /// Retries transcript retrieval for a single session
        /// </summary>
        private async Task RetryTranscriptRetrievalAsync(
            Session session,
            IBaseRepository<Session> sessionRepository,
            IBlobStorageService blobStorageService,
            IDeepgramService deepgramService)
        {
            try
            {
                session.TranscriptRetrievalAttempts++;
                session.LastTranscriptRetrievalAttempt = DateTime.UtcNow;

                _logger.LogInformation(
                    "[AUDIT] Retrying transcript retrieval for session {SessionId}, meeting {MeetingId}. " +
                    "Attempt {Attempt}/{MaxAttempts}. Timestamp: {Timestamp}",
                    session.Id, session.ZoomMeetingId, session.TranscriptRetrievalAttempts, MaxRetryAttempts, DateTime.UtcNow);

                bool transcriptProcessed = false;

                // 1. Try Deepgram Transcription via R2 URL
                try 
                {
                    if (!string.IsNullOrEmpty(session.VideoStorageKey))
                    {
                        _logger.LogInformation(
                            "Attempting Deepgram retry for session {SessionId} using R2 storage key {Key}",
                            session.Id, session.VideoStorageKey);

                        // Generate presigned URL from R2
                        var presignedUrl = await blobStorageService.GetPresignedUrlAsync(session.VideoStorageKey, TimeSpan.FromMinutes(60));
                        
                        // Transcribe using the URL
                        var transcript = await deepgramService.TranscribeAudioUrlAsync(presignedUrl);

                        if (!string.IsNullOrEmpty(transcript))
                        {
                            session.Transcript = transcript;
                            session.TranscriptProcessed = true;
                            transcriptProcessed = true;
                            
                            _logger.LogInformation(
                                "[AUDIT] Successfully retrieved Deepgram transcript for session {SessionId} on retry. Timestamp: {Timestamp}",
                                session.Id, DateTime.UtcNow);

                            await TriggerAISummaryGenerationEventAsync(session);
                        }
                    }
                    else
                    {
                         _logger.LogWarning(
                            "No VideoStorageKey found for session {SessionId} retry. Skipping Deepgram.",
                            session.Id);
                    }
                }
                catch (Exception ex)
                {
                     _logger.LogError(
                        ex,
                        "Failed Deepgram retry for session {SessionId}.",
                        session.Id);
                }

                if (!transcriptProcessed)
                {
                    _logger.LogWarning(
                        "[AUDIT] Transcript retrieval returned empty content for session {SessionId}, attempt {Attempt}/{MaxAttempts}. " +
                        "Will retry. Timestamp: {Timestamp}",
                        session.Id, session.TranscriptRetrievalAttempts, MaxRetryAttempts, DateTime.UtcNow);
                }

                // Save changes
                sessionRepository.Update(session);
                await sessionRepository.SaveChangesAsync();

                // Check if max attempts reached
                if (!session.TranscriptProcessed && session.TranscriptRetrievalAttempts >= MaxRetryAttempts)
                {
                    _logger.LogError(
                        "[AUDIT] Max transcript retrieval attempts ({MaxAttempts}) reached for session {SessionId}. " +
                        "Transcript will not be available. Timestamp: {Timestamp}",
                        MaxRetryAttempts, session.Id, DateTime.UtcNow);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "[AUDIT] Error retrying transcript retrieval for session {SessionId}, attempt {Attempt}/{MaxAttempts}. " +
                    "Timestamp: {Timestamp}",
                    session.Id, session.TranscriptRetrievalAttempts, MaxRetryAttempts, DateTime.UtcNow);

                // Save the attempt count even on failure
                try
                {
                    sessionRepository.Update(session);
                    await sessionRepository.SaveChangesAsync();
                }
                catch (Exception saveEx)
                {
                    _logger.LogError(
                        saveEx,
                        "Failed to save transcript retry attempt for session {SessionId}",
                        session.Id);
                }
            }
        }

        /// <summary>
        /// Triggers AI summary generation event when transcript is successfully stored
        /// </summary>
        private Task TriggerAISummaryGenerationEventAsync(Session session)
        {
            using var scope = _serviceProvider.CreateScope();
            var jobScheduler = scope.ServiceProvider.GetRequiredService<IJobScheduler>();
            jobScheduler.EnqueueAsync<IAiSummaryService>(s => s.GenerateAndStoreSummaryAsync(session.Id, default));
            _logger.LogInformation("[AUDIT] AI summary job enqueued for session {SessionId}", session.Id);
            return Task.CompletedTask;
        }

        /// <summary>
        /// Stops the transcript retry timer
        /// </summary>
        public void Stop()
        {
            _logger.LogInformation("Stopping TranscriptRetryTimer");
            _timer?.Change(Timeout.Infinite, Timeout.Infinite);
        }

        /// <summary>
        /// Disposes the timer resources
        /// </summary>
        public void Dispose()
        {
            if (_disposed)
                return;

            _logger.LogInformation("Disposing TranscriptRetryTimer");
            _timer?.Dispose();
            _disposed = true;
            GC.SuppressFinalize(this);
        }
    }
}
