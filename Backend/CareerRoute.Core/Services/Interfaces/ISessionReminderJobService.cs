using System;
using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Interfaces
{
    /// <summary>
    /// Service for scheduling and managing session reminder notifications via Hangfire jobs.
    /// </summary>
    public interface ISessionReminderJobService
    {
        /// <summary>
        /// Schedules a reminder notification job for a session.
        /// The reminder will be sent 15 minutes before the session start time.
        /// </summary>
        /// <param name="sessionId">The session ID</param>
        /// <param name="mentorId">The mentor's user ID</param>
        /// <param name="menteeId">The mentee's user ID</param>
        /// <param name="mentorName">The mentor's display name</param>
        /// <param name="menteeName">The mentee's display name</param>
        /// <param name="sessionStartTime">The scheduled session start time (UTC)</param>
        /// <returns>The Hangfire job ID for later cancellation, or empty string if session starts too soon</returns>
        string ScheduleReminder(string sessionId, string mentorId, string menteeId,
            string mentorName, string menteeName, DateTime sessionStartTime);

        /// <summary>
        /// Cancels a previously scheduled reminder job.
        /// </summary>
        /// <param name="jobId">The Hangfire job ID to cancel</param>
        void CancelReminder(string? jobId);

        /// <summary>
        /// Sends the actual reminder notifications to both participants.
        /// This method is called by Hangfire when the scheduled job executes.
        /// </summary>
        Task SendReminderAsync(string sessionId, string mentorId, string menteeId,
            string mentorName, string menteeName, DateTime sessionStartTime);
    }
}
