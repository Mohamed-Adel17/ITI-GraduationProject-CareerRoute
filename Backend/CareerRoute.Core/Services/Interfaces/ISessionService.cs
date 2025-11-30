using CareerRoute.Core.DTOs.Sessions;
using CareerRoute.Core.DTOs.Zoom;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Interfaces
{
    /// <summary>
    /// Session business operations including booking flow and Zoom/media handling.
    /// </summary>
    public interface ISessionService
    {
        // Booking and lifecycle operations
        /// <summary>
        /// Books a session for the mentee and returns booking details including payment/session info.
        /// </summary>
        Task<BookSessionResponseDto> BookSessionAsync(string menteeId, BookSessionRequestDto dto);
        /// <summary>
        /// Gets detailed information about a session for the requesting user.
        /// </summary>
        Task<SessionDetailsResponseDto> GetSessionDetailsAsync(string sessionId, string userId, string userRole);
        /// <summary>
        /// Retrieves upcoming sessions for the user with pagination.
        /// </summary>
        Task<UpcomingSessionsResponse> GetUpcomingSessionsAsync(string userId, string userRole, int page, int pageSize);
        /// <summary>
        /// Retrieves past sessions for the user with pagination.
        /// </summary>
        Task<PastSessionsResponse> GetPastSessionsAsync(string userId, string userRole, int page, int pageSize);
        /// <summary>
        /// Requests a reschedule for a session.
        /// </summary>
        Task<RescheduleSessionResponseDto> RescheduleSessionAsync(string sessionId, RescheduleSessionRequestDto dto, string userId, string role);
        /// <summary>
        /// Cancels a session with user context and request details.
        /// </summary>
        Task<CancelSessionResponseDto> CancelSessionAsync(string sessionId, CancelSessionRequestDto dto, string userId, string role);
        /// <summary>
        /// Provides join info for a user to enter a session.
        /// </summary>
        Task<JoinSessionResponseDto> JoinSessionAsync(string sessionId, string userId);
        /// <summary>
        /// Completes a session, marking it finished by role.
        /// </summary>
        Task<CompleteSessionResponseDto> CompleteSessionAsync(string sessionId, string userId, string role);
        /// <summary>
        /// Approves a pending reschedule request.
        /// </summary>
        Task<RescheduleSessionResponseDto> ApproveRescheduleAsync(string rescheduleId, string userId, string role);
        /// <summary>
        /// Rejects a pending reschedule request.
        /// </summary>
        Task<RescheduleSessionResponseDto> RejectRescheduleAsync(string rescheduleId, string userId, string role);

        /// <summary>
        /// Gets details of a reschedule request for display on approval page.
        /// </summary>
        Task<RescheduleDetailsDto> GetRescheduleDetailsAsync(string rescheduleId, string userId, string role);
        /// <summary>
        /// Releases an unpaid session so its slot can be reused.
        /// </summary>
        Task ReleaseUnpaidSessionAsync(string sessionId);

        // Zoom / media operations
        /// <summary>
        /// Creates a Zoom meeting for the session after payment confirmation.
        /// </summary>
        Task CreateZoomMeetingForSessionAsync(string sessionId);
        /// <summary>
        /// Retrieves session recording info for an authorized user.
        /// </summary>
        Task<SessionRecordingDto> GetSessionRecordingAsync(string sessionId, string userId);
        /// <summary>
        /// Retrieves transcript content for an authorized user.
        /// </summary>
        Task<string> GetSessionTranscriptAsync(string sessionId, string userId);

        /// <summary>
        /// Retrieves AI-generated summary for an authorized user.
        /// </summary>
        Task<string> GetSessionSummaryAsync(string sessionId, string userId);
        /// <summary>
        /// Cancels a session and deletes the associated Zoom meeting.
        /// </summary>
        Task CancelSessionAsync(string sessionId, string cancellationReason);
        /// <summary>
        /// Reschedules a session and updates the Zoom meeting timings.
        /// </summary>
        Task RescheduleSessionAsync(string sessionId, DateTime newStartTime, DateTime newEndTime);
        /// <summary>
        /// Returns the video link details for a session for an authorized user.
        /// </summary>
        Task<VideoLinkDto> GetVideoLinkAsync(string sessionId, string userId);
        /// <summary>
        /// Ends the Zoom meeting for a session (mentor only).
        /// </summary>
        Task EndSessionAsync(string sessionId, string userId);
        /// <summary>
        /// Terminates a session that exceeded its scheduled end time (background job).
        /// </summary>
        Task AutoTerminateSessionAsync(string sessionId);
        /// <summary>
        /// Processes Zoom recording completion webhook payload and persists artifacts.
        /// </summary>
        Task ProcessRecordingCompletedAsync(long meetingId, List<ZoomRecordingFileDto> recordingFiles, string? downloadAccessToken = null);
        /// <summary>
        /// Sends Zoom meeting link email to both mentor and mentee (scheduled 15 min before session).
        /// </summary>
        Task SendZoomLinkEmailAsync(string sessionId);
    }
}
