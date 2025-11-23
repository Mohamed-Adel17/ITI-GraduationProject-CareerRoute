using CareerRoute.Core.DTOs.Zoom;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Interfaces
{
    /// <summary>
    /// Service interface for Zoom API integration
    /// </summary>
    public interface IZoomService
    {
        /// <summary>
        /// Creates a scheduled Zoom meeting
        /// </summary>
        Task<ZoomMeetingDto> CreateMeetingAsync(CreateZoomMeetingRequest request, string? sessionId = null);

        /// <summary>
        /// Deletes a Zoom meeting by meeting ID
        /// </summary>
        Task<bool> DeleteMeetingAsync(long meetingId, string? sessionId = null);

        /// <summary>
        /// Updates the start time of an existing meeting by meeting ID
        /// </summary>
        Task<bool> UpdateMeetingStartTimeAsync(long meetingId, DateTime newStartTime, string? sessionId = null);

        /// <summary>
        /// Ends an active meeting for all participants by meeting ID
        /// </summary>
        Task<bool> EndMeetingAsync(long meetingId, string? sessionId = null, string? reason = null);

        /// <summary>
        /// Retrieves meeting details by meeting ID
        /// </summary>
        Task<ZoomMeetingDto> GetMeetingAsync(long meetingId, string? sessionId = null);

        /// <summary>
        /// Retrieves recording URLs and metadata for a completed meeting
        /// Note: Uses meeting ID (long) - Zoom API accepts both ID and UUID for recordings
        /// </summary>
        Task<ZoomRecordingDto> GetMeetingRecordingsAsync(long meetingId, string? sessionId = null);

        /// <summary>
        /// Downloads a file from Zoom using the download URL (handling authentication)
        /// </summary>
        Task<System.IO.Stream> DownloadFileStreamAsync(string downloadUrl, string? downloadAccessToken = null);

        /// <summary>
        /// Generates a time-limited access token for mentee to view recording
        /// </summary>
        Task<string> GenerateRecordingAccessTokenAsync(string recordingId, string menteeId);
    }
}
