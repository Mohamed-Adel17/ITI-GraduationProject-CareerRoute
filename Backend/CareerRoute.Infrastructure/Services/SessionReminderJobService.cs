using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace CareerRoute.Infrastructure.Services
{
    /// <summary>
    /// Service for scheduling session reminder notifications via Hangfire jobs.
    /// Reminders are scheduled when sessions are booked and cancelled when sessions are cancelled/rescheduled.
    /// </summary>
    public class SessionReminderJobService : ISessionReminderJobService
    {
        private readonly IJobScheduler _jobScheduler;
        private readonly ISignalRNotificationService _notificationService;
        private readonly ILogger<SessionReminderJobService> _logger;
        private static readonly TimeSpan ReminderOffset = TimeSpan.FromMinutes(15);

        public SessionReminderJobService(
            IJobScheduler jobScheduler,
            ISignalRNotificationService notificationService,
            ILogger<SessionReminderJobService> logger)
        {
            _jobScheduler = jobScheduler;
            _notificationService = notificationService;
            _logger = logger;
        }

        public string ScheduleReminder(string sessionId, string mentorId, string menteeId,
            string mentorName, string menteeName, DateTime sessionStartTime)
        {
            var reminderTime = sessionStartTime.Subtract(ReminderOffset);
            var delay = reminderTime - DateTime.UtcNow;

            if (delay <= TimeSpan.Zero)
            {
                _logger.LogInformation(
                    "Session {SessionId} starts too soon for reminder (starts at {StartTime})",
                    sessionId, sessionStartTime);
                return string.Empty;
            }

            var jobId = _jobScheduler.Schedule<ISessionReminderJobService>(
                service => service.SendReminderAsync(sessionId, mentorId, menteeId,
                    mentorName, menteeName, sessionStartTime),
                delay);

            _logger.LogInformation(
                "Scheduled reminder job {JobId} for session {SessionId} at {ReminderTime}",
                jobId, sessionId, reminderTime);

            return jobId;
        }

        public void CancelReminder(string? jobId)
        {
            if (string.IsNullOrEmpty(jobId))
                return;

            var deleted = _jobScheduler.Delete(jobId);

            if (deleted)
            {
                _logger.LogInformation("Cancelled reminder job {JobId}", jobId);
            }
            else
            {
                _logger.LogWarning("Failed to cancel reminder job {JobId} (may have already executed)", jobId);
            }
        }

        public async Task SendReminderAsync(string sessionId, string mentorId, string menteeId,
            string mentorName, string menteeName, DateTime sessionStartTime)
        {
            var startTimeFormatted = sessionStartTime.ToString("MMM dd, yyyy 'at' h:mm tt");

            try
            {
                // Send reminder to mentee
                await _notificationService.SendNotificationAsync(
                    menteeId,
                    NotificationType.SessionReminder,
                    "Session Starting Soon",
                    $"Your session with {mentorName} starts in 15 minutes ({startTimeFormatted}).",
                    $"user/sessions/{sessionId}");

                // Send reminder to mentor
                await _notificationService.SendNotificationAsync(
                    mentorId,
                    NotificationType.SessionReminder,
                    "Session Starting Soon",
                    $"Your session with {menteeName} starts in 15 minutes ({startTimeFormatted}).",
                    $"mentor/sessions/{sessionId}");

                _logger.LogInformation(
                    "Sent reminder notifications for session {SessionId} starting at {StartTime}",
                    sessionId, sessionStartTime);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send reminder notifications for session {SessionId}", sessionId);
                throw;
            }
        }
    }
}
