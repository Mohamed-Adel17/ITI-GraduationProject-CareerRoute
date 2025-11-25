using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Settings;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.DTOs.Zoom;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace CareerRoute.Infrastructure.Services
{
    /// <summary>
    /// Service implementation for Zoom API integration
    /// </summary>
    public class ZoomService : IZoomService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ZoomSettings _zoomSettings;
        private readonly ILogger<ZoomService> _logger;

        // Static token caching with expiration tracking
        private static string? _cachedToken;
        private static DateTime _tokenExpiration = DateTime.MinValue;
        private static readonly SemaphoreSlim _tokenLock = new SemaphoreSlim(1, 1);

        public ZoomService(
            IHttpClientFactory httpClientFactory,
            IOptions<ZoomSettings> zoomSettings,
            ILogger<ZoomService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _zoomSettings = zoomSettings.Value;
            _logger = logger;
        }

        /// <summary>
        /// Gets an access token using Server-to-Server OAuth flow with caching
        /// </summary>
        private async Task<string> GetAccessTokenAsync()
        {
            // Check if we have a valid cached token
            if (_cachedToken != null && DateTime.UtcNow < _tokenExpiration)
            {
                return _cachedToken;
            }

            // Use semaphore for thread-safe token refresh
            await _tokenLock.WaitAsync();
            try
            {
                // Double-check after acquiring lock (another thread might have refreshed)
                if (_cachedToken != null && DateTime.UtcNow < _tokenExpiration)
                {
                    return _cachedToken;
                }

                _logger.LogInformation("Fetching new Zoom access token using Server-to-Server OAuth");

                // Fetch new token from Zoom
                var client = _httpClientFactory.CreateClient();
                
                // Create Basic Auth header with ClientId:ClientSecret
                var credentials = Convert.ToBase64String(
                    Encoding.UTF8.GetBytes($"{_zoomSettings.ClientId}:{_zoomSettings.ClientSecret}"));
                
                var request = new HttpRequestMessage(HttpMethod.Post, _zoomSettings.OAuthTokenUrl);
                request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
                
                // Add form data for Server-to-Server OAuth
                var formData = new Dictionary<string, string>
                {
                    { "grant_type", "account_credentials" },
                    { "account_id", _zoomSettings.AccountId }
                };
                request.Content = new FormUrlEncodedContent(formData);

                var response = await client.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError(
                        "Failed to obtain Zoom access token. Status: {StatusCode}, Error: {Error}",
                        response.StatusCode,
                        errorContent);
                    
                    throw new BusinessException(
                        "Failed to authenticate with Zoom service. Please contact support.");
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var tokenResponse = JsonSerializer.Deserialize<ZoomTokenResponse>(responseContent);

                if (tokenResponse?.AccessToken == null)
                {
                    _logger.LogError("Zoom token response did not contain access_token");
                    throw new BusinessException("Failed to authenticate with Zoom service. Please contact support.");
                }

                // Cache the token with expiration (use configured minutes, default 55)
                _cachedToken = tokenResponse.AccessToken;
                _tokenExpiration = DateTime.UtcNow.AddMinutes(_zoomSettings.TokenExpirationMinutes);

                _logger.LogInformation("Successfully obtained Zoom access token, expires at {ExpiresAt}", _tokenExpiration);

                return _cachedToken;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Network error while obtaining Zoom access token");
                throw new BusinessException("Unable to connect to Zoom service. Please try again later.", ex);
            }
            finally
            {
                _tokenLock.Release();
            }
        }

        /// <summary>
        /// Makes an authenticated HTTP request to Zoom API with comprehensive retry logic and error handling
        /// </summary>
        private async Task<HttpResponseMessage> MakeAuthenticatedRequestAsync(
            HttpMethod method,
            string endpoint,
            HttpContent? content = null,
            bool isTokenRetry = false)
        {
            var accessToken = await GetAccessTokenAsync();
            var client = _httpClientFactory.CreateClient();
            
            // Set timeout for the request
            client.Timeout = TimeSpan.FromSeconds(30);
            
            var request = new HttpRequestMessage(method, $"{_zoomSettings.ApiBaseUrl}{endpoint}");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            
            if (content != null)
            {
                request.Content = content;
            }

            HttpResponseMessage response;
            
            try
            {
                response = await client.SendAsync(request);
            }
            catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException || !ex.CancellationToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "Request to Zoom API timed out: {Method} {Endpoint}", method, endpoint);
                throw new BusinessException("Video conferencing service request timed out. Please try again.", ex);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Network error during Zoom API request: {Method} {Endpoint}", method, endpoint);
                throw new BusinessException("Unable to connect to video conferencing service. Please try again later.", ex);
            }

            // Handle 401 Unauthorized - refresh token and retry once
            if (response.StatusCode == HttpStatusCode.Unauthorized && !isTokenRetry)
            {
                _logger.LogWarning("Received 401 Unauthorized from Zoom API, refreshing token and retrying");
                
                // Invalidate cached token to force refresh
                await _tokenLock.WaitAsync();
                try
                {
                    _cachedToken = null;
                    _tokenExpiration = DateTime.MinValue;
                }
                finally
                {
                    _tokenLock.Release();
                }

                // Retry the request with fresh token
                return await MakeAuthenticatedRequestAsync(method, endpoint, content, isTokenRetry: true);
            }

            return response;
        }

        /// <summary>
        /// Makes an authenticated HTTP request with exponential backoff retry logic
        /// </summary>
        private async Task<HttpResponseMessage> MakeAuthenticatedRequestWithRetryAsync(
            HttpMethod method,
            string endpoint,
            HttpContent? content = null,
            string? operationName = null,
            string? sessionId = null,
            long? meetingId = null)
        {
            int maxRetries = 5; // Max retries for rate limiting
            int serverErrorRetries = 3; // Max retries for server errors
            int attempt = 0;
            int serverErrorAttempt = 0;
            var startTime = DateTime.UtcNow;

            while (true)
            {
                try
                {
                    var response = await MakeAuthenticatedRequestAsync(method, endpoint, content);

                    // Handle 429 Rate Limit - exponential backoff with max 5 retries
                    if (response.StatusCode == (HttpStatusCode)429)
                    {
                        attempt++;
                        
                        if (attempt > maxRetries)
                        {
                            var errorContent = await response.Content.ReadAsStringAsync();
                            _logger.LogError(
                                "[AUDIT] Zoom API operation FAILED - Rate limit exceeded. " +
                                "Operation: {Operation}, SessionId: {SessionId}, MeetingId: {MeetingId}, " +
                                "Endpoint: {Endpoint}, StatusCode: 429, RetryAttempts: {Attempts}, " +
                                "Timestamp: {Timestamp}, Error: {Error}",
                                operationName ?? "Unknown",
                                sessionId ?? "N/A",
                                meetingId?.ToString() ?? "N/A",
                                endpoint,
                                maxRetries,
                                DateTime.UtcNow,
                                errorContent);
                            
                            throw new BusinessException(
                                "Video conferencing service is temporarily unavailable due to high demand. Please try again in a few minutes.");
                        }

                        // Calculate exponential backoff delay: baseDelay * (2 ^ attempt), max 32 seconds
                        var delayMilliseconds = Math.Min(
                            _zoomSettings.RetryDelayMilliseconds * (int)Math.Pow(2, attempt),
                            32000);

                        _logger.LogWarning(
                            "[AUDIT] Zoom API rate limit hit - Retrying. Operation: {Operation}, " +
                            "SessionId: {SessionId}, MeetingId: {MeetingId}, Attempt: {Attempt}/{MaxRetries}, " +
                            "RetryDelay: {Delay}ms, Timestamp: {Timestamp}",
                            operationName ?? "Unknown",
                            sessionId ?? "N/A",
                            meetingId?.ToString() ?? "N/A",
                            attempt,
                            maxRetries,
                            delayMilliseconds,
                            DateTime.UtcNow);

                        await Task.Delay(delayMilliseconds);
                        continue;
                    }

                    // Handle 500 Internal Server Error - exponential backoff with max 3 retries
                    if (response.StatusCode == HttpStatusCode.InternalServerError)
                    {
                        serverErrorAttempt++;
                        
                        if (serverErrorAttempt > serverErrorRetries)
                        {
                            var errorContent = await response.Content.ReadAsStringAsync();
                            _logger.LogError(
                                "[AUDIT] Zoom API operation FAILED - Server error. " +
                                "Operation: {Operation}, SessionId: {SessionId}, MeetingId: {MeetingId}, " +
                                "Endpoint: {Endpoint}, StatusCode: 500, RetryAttempts: {Attempts}, " +
                                "Timestamp: {Timestamp}, Error: {Error}",
                                operationName ?? "Unknown",
                                sessionId ?? "N/A",
                                meetingId?.ToString() ?? "N/A",
                                endpoint,
                                serverErrorRetries,
                                DateTime.UtcNow,
                                errorContent);
                            
                            throw new BusinessException(
                                "Video conferencing service encountered an error. Please try again or contact support.");
                        }

                        // Calculate exponential backoff delay
                        var delayMilliseconds = Math.Min(
                            _zoomSettings.RetryDelayMilliseconds * (int)Math.Pow(2, serverErrorAttempt),
                            32000);

                        _logger.LogWarning(
                            "[AUDIT] Zoom API server error - Retrying. Operation: {Operation}, " +
                            "SessionId: {SessionId}, MeetingId: {MeetingId}, Attempt: {Attempt}/{MaxRetries}, " +
                            "RetryDelay: {Delay}ms, Timestamp: {Timestamp}",
                            operationName ?? "Unknown",
                            sessionId ?? "N/A",
                            meetingId?.ToString() ?? "N/A",
                            serverErrorAttempt,
                            serverErrorRetries,
                            delayMilliseconds,
                            DateTime.UtcNow);

                        await Task.Delay(delayMilliseconds);
                        continue;
                    }

                    // Handle other error status codes
                    if (!response.IsSuccessStatusCode)
                    {
                        await HandleErrorResponseAsync(response, operationName, endpoint, sessionId, meetingId);
                    }

                    // Log successful operation with audit trail
                    var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
                    _logger.LogInformation(
                        "[AUDIT] Zoom API operation SUCCESS. " +
                        "Operation: {Operation}, SessionId: {SessionId}, MeetingId: {MeetingId}, " +
                        "Endpoint: {Endpoint}, StatusCode: {StatusCode}, " +
                        "RateLimitRetries: {RateLimitAttempts}, ServerErrorRetries: {ServerErrorAttempts}, " +
                        "Duration: {Duration}ms, Timestamp: {Timestamp}",
                        operationName ?? "Unknown",
                        sessionId ?? "N/A",
                        meetingId?.ToString() ?? "N/A",
                        endpoint,
                        (int)response.StatusCode,
                        attempt,
                        serverErrorAttempt,
                        duration,
                        DateTime.UtcNow);

                    return response;
                }
                catch (BusinessException)
                {
                    // Re-throw business exceptions (already logged)
                    throw;
                }
                catch (ValidationException)
                {
                    // Re-throw validation exceptions (already logged)
                    throw;
                }
                catch (NotFoundException)
                {
                    // Re-throw not found exceptions (already logged)
                    throw;
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "[AUDIT] Zoom API operation FAILED - Unexpected error. " +
                        "Operation: {Operation}, SessionId: {SessionId}, MeetingId: {MeetingId}, " +
                        "Endpoint: {Endpoint}, Timestamp: {Timestamp}",
                        operationName ?? "Unknown",
                        sessionId ?? "N/A",
                        meetingId?.ToString() ?? "N/A",
                        endpoint,
                        DateTime.UtcNow);
                    throw new BusinessException("An unexpected error occurred with the video conferencing service. Please contact support.", ex);
                }
            }
        }

        /// <summary>
        /// Handles error responses from Zoom API and maps them to appropriate exceptions
        /// </summary>
        private async Task HandleErrorResponseAsync(
            HttpResponseMessage response, 
            string? operationName, 
            string endpoint,
            string? sessionId = null,
            long? meetingId = null)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            var statusCode = (int)response.StatusCode;

            _logger.LogError(
                "[AUDIT] Zoom API operation FAILED. " +
                "Operation: {Operation}, SessionId: {SessionId}, MeetingId: {MeetingId}, " +
                "Endpoint: {Endpoint}, StatusCode: {StatusCode}, Timestamp: {Timestamp}, Error: {Error}",
                operationName ?? "Unknown",
                sessionId ?? "N/A",
                meetingId?.ToString() ?? "N/A",
                endpoint,
                statusCode,
                DateTime.UtcNow,
                errorContent);

            switch (response.StatusCode)
            {
                case HttpStatusCode.BadRequest:
                    // Parse validation errors if available
                    var errors = new Dictionary<string, string[]>
                    {
                        { "ZoomApi", new[] { errorContent } }
                    };
                    throw new ValidationException(errors);

                case HttpStatusCode.NotFound:
                    throw new NotFoundException($"Zoom resource not found: {errorContent}");

                case HttpStatusCode.Conflict:
                    throw new ConflictException($"Zoom resource conflict: {errorContent}");

                case HttpStatusCode.Unauthorized:
                    throw new UnauthenticatedException("Failed to authenticate with Zoom service");

                default:
                    throw new BusinessException(
                        $"Video conferencing service returned an error (Status: {statusCode}). Please try again or contact support.");
            }
        }

        /// <summary>
        /// Internal class for deserializing Zoom OAuth token response
        /// </summary>
        private class ZoomTokenResponse
        {
            [System.Text.Json.Serialization.JsonPropertyName("access_token")]
            public string? AccessToken { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("token_type")]
            public string? TokenType { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("expires_in")]
            public int ExpiresIn { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("scope")]
            public string? Scope { get; set; }
        }

        /// <summary>
        /// Creates a scheduled Zoom meeting with full configuration
        /// </summary>
        public async Task<ZoomMeetingDto> CreateMeetingAsync(CreateZoomMeetingRequest request, string? sessionId = null)
        {
            _logger.LogInformation(
                "[AUDIT] Creating Zoom meeting. SessionId: {SessionId}, Topic: {Topic}, " +
                "StartTime: {StartTime}, Duration: {Duration}, Timestamp: {Timestamp}",
                sessionId ?? "N/A",
                request.Topic,
                request.StartTime,
                request.DurationMinutes,
                DateTime.UtcNow);

            // Build the Zoom API request payload
            var zoomRequest = new
            {
                topic = request.Topic,
                type = 2, // Scheduled meeting
                start_time = request.StartTime.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                duration = request.DurationMinutes,
                timezone = request.Timezone,
                settings = new
                {
                    host_video = true,
                    participant_video = true,
                    join_before_host = true,
                    jbh_time = 5, // Allow joining 5 minutes before start time
                    mute_upon_entry = true,
                    waiting_room = false,
                    auto_recording = "cloud", // Cloud auto-recording
                    audio = "both",
                    approval_type = 2, // No registration required
                    recording_authentication = true, // Authenticated viewers only
                    on_demand = false, // Disable download capability
                    audio_transcript = true // Enable transcript generation
                }
            };

            var jsonContent = JsonSerializer.Serialize(zoomRequest);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            // Make authenticated request with retry logic
            var response = await MakeAuthenticatedRequestWithRetryAsync(
                HttpMethod.Post,
                "users/me/meetings",
                content,
                "CreateMeeting",
                sessionId);

            var responseContent = await response.Content.ReadAsStringAsync();
            var zoomResponse = JsonSerializer.Deserialize<ZoomApiMeetingResponse>(responseContent);

            if (zoomResponse == null)
            {
                _logger.LogError(
                    "[AUDIT] Failed to deserialize Zoom meeting response. SessionId: {SessionId}, Timestamp: {Timestamp}",
                    sessionId ?? "N/A",
                    DateTime.UtcNow);
                throw new BusinessException("Failed to create video conference meeting. Please contact support.");
            }

            _logger.LogInformation(
                "[AUDIT] Successfully created Zoom meeting. SessionId: {SessionId}, MeetingId: {MeetingId}, " +
                "JoinUrl: {JoinUrl}, Timestamp: {Timestamp}",
                sessionId ?? "N/A",
                zoomResponse.Id,
                zoomResponse.JoinUrl,
                DateTime.UtcNow);

            return new ZoomMeetingDto
            {
                Id = zoomResponse.Id,
                Uuid = zoomResponse.Uuid ?? string.Empty,
                Topic = zoomResponse.Topic ?? string.Empty,
                JoinUrl = zoomResponse.JoinUrl ?? string.Empty,
                StartUrl = zoomResponse.StartUrl ?? string.Empty,
                Password = zoomResponse.Password ?? string.Empty,
                StartTime = zoomResponse.StartTime,
                Duration = zoomResponse.Duration,
                Status = zoomResponse.Status ?? string.Empty
            };
        }

        /// <summary>
        /// Deletes a Zoom meeting by meeting ID
        /// </summary>
        public async Task<bool> DeleteMeetingAsync(long meetingId, string? sessionId = null)
        {
            _logger.LogInformation(
                "[AUDIT] Deleting Zoom meeting. SessionId: {SessionId}, MeetingId: {MeetingId}, Timestamp: {Timestamp}",
                sessionId ?? "N/A",
                meetingId,
                DateTime.UtcNow);

            try
            {
                var response = await MakeAuthenticatedRequestWithRetryAsync(
                    HttpMethod.Delete,
                    $"meetings/{meetingId}",
                    null,
                    "DeleteMeeting",
                    sessionId,
                    meetingId);

                _logger.LogInformation(
                    "[AUDIT] Successfully deleted Zoom meeting. SessionId: {SessionId}, MeetingId: {MeetingId}, Timestamp: {Timestamp}",
                    sessionId ?? "N/A",
                    meetingId,
                    DateTime.UtcNow);
                return true;
            }
            catch (NotFoundException)
            {
                _logger.LogWarning(
                    "[AUDIT] Zoom meeting not found for deletion. SessionId: {SessionId}, MeetingId: {MeetingId}, Timestamp: {Timestamp}",
                    sessionId ?? "N/A",
                    meetingId,
                    DateTime.UtcNow);
                return false;
            }
        }

        /// <summary>
        /// Updates the start time of an existing meeting
        /// </summary>
        public async Task<bool> UpdateMeetingStartTimeAsync(long meetingId, DateTime newStartTime, string? sessionId = null)
        {
            _logger.LogInformation(
                "[AUDIT] Updating Zoom meeting start time. SessionId: {SessionId}, MeetingId: {MeetingId}, " +
                "NewStartTime: {NewStartTime}, Timestamp: {Timestamp}",
                sessionId ?? "N/A",
                meetingId,
                newStartTime,
                DateTime.UtcNow);

            var updateRequest = new
            {
                start_time = newStartTime.ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            var jsonContent = JsonSerializer.Serialize(updateRequest);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            var response = await MakeAuthenticatedRequestWithRetryAsync(
                new HttpMethod("PATCH"),
                $"meetings/{meetingId}",
                content,
                "UpdateMeetingStartTime",
                sessionId,
                meetingId);

            _logger.LogInformation(
                "[AUDIT] Successfully updated Zoom meeting start time. SessionId: {SessionId}, MeetingId: {MeetingId}, Timestamp: {Timestamp}",
                sessionId ?? "N/A",
                meetingId,
                DateTime.UtcNow);
            return true;
        }

        /// <summary>
        /// Ends an active meeting for all participants
        /// </summary>
        public async Task<bool> EndMeetingAsync(long meetingId, string? sessionId = null, string? reason = null)
        {
            _logger.LogInformation(
                "[AUDIT] Ending Zoom meeting. SessionId: {SessionId}, MeetingId: {MeetingId}, " +
                "Reason: {Reason}, Timestamp: {Timestamp}",
                sessionId ?? "N/A",
                meetingId,
                reason ?? "Manual termination",
                DateTime.UtcNow);

            try
            {
                var response = await MakeAuthenticatedRequestWithRetryAsync(
                    HttpMethod.Put,
                    $"meetings/{meetingId}/status",
                    new StringContent(
                        JsonSerializer.Serialize(new { action = "end" }),
                        Encoding.UTF8,
                        "application/json"),
                    "EndMeeting",
                    sessionId,
                    meetingId);

                _logger.LogInformation(
                    "[AUDIT] Successfully ended Zoom meeting. SessionId: {SessionId}, MeetingId: {MeetingId}, " +
                    "Reason: {Reason}, Timestamp: {Timestamp}",
                    sessionId ?? "N/A",
                    meetingId,
                    reason ?? "Manual termination",
                    DateTime.UtcNow);
                return true;
            }
            catch (NotFoundException)
            {
                _logger.LogWarning(
                    "[AUDIT] Zoom meeting not found for termination. SessionId: {SessionId}, MeetingId: {MeetingId}, " +
                    "Reason: {Reason}, Timestamp: {Timestamp}",
                    sessionId ?? "N/A",
                    meetingId,
                    reason ?? "Manual termination",
                    DateTime.UtcNow);
                return false;
            }
        }

        /// <summary>
        /// Retrieves meeting details by meeting ID
        /// </summary>
        public async Task<ZoomMeetingDto> GetMeetingAsync(long meetingId, string? sessionId = null)
        {
            _logger.LogInformation(
                "[AUDIT] Retrieving Zoom meeting details. SessionId: {SessionId}, MeetingId: {MeetingId}, Timestamp: {Timestamp}",
                sessionId ?? "N/A",
                meetingId,
                DateTime.UtcNow);

            var response = await MakeAuthenticatedRequestWithRetryAsync(
                HttpMethod.Get,
                $"meetings/{meetingId}",
                null,
                "GetMeeting",
                sessionId,
                meetingId);

            var responseContent = await response.Content.ReadAsStringAsync();
            var zoomResponse = JsonSerializer.Deserialize<ZoomApiMeetingResponse>(responseContent);

            if (zoomResponse == null)
            {
                _logger.LogError(
                    "[AUDIT] Failed to deserialize Zoom meeting response. SessionId: {SessionId}, MeetingId: {MeetingId}, Timestamp: {Timestamp}",
                    sessionId ?? "N/A",
                    meetingId,
                    DateTime.UtcNow);
                throw new BusinessException("Failed to retrieve video conference meeting details. Please contact support.");
            }

            _logger.LogInformation(
                "[AUDIT] Successfully retrieved Zoom meeting. SessionId: {SessionId}, MeetingId: {MeetingId}, Timestamp: {Timestamp}",
                sessionId ?? "N/A",
                meetingId,
                DateTime.UtcNow);

            return new ZoomMeetingDto
            {
                Id = zoomResponse.Id,
                Uuid = zoomResponse.Uuid ?? string.Empty,
                Topic = zoomResponse.Topic ?? string.Empty,
                JoinUrl = zoomResponse.JoinUrl ?? string.Empty,
                StartUrl = zoomResponse.StartUrl ?? string.Empty,
                Password = zoomResponse.Password ?? string.Empty,
                StartTime = zoomResponse.StartTime,
                Duration = zoomResponse.Duration,
                Status = zoomResponse.Status ?? string.Empty
            };
        }

        /// <summary>
        /// Retrieves recording URLs and metadata for a completed meeting
        /// </summary>
        public async Task<ZoomRecordingDto> GetMeetingRecordingsAsync(long meetingId, string? sessionId = null)
        {
            _logger.LogInformation(
                "[AUDIT] Retrieving Zoom meeting recordings. SessionId: {SessionId}, MeetingId: {MeetingId}, Timestamp: {Timestamp}",
                sessionId ?? "N/A",
                meetingId,
                DateTime.UtcNow);

            var response = await MakeAuthenticatedRequestWithRetryAsync(
                HttpMethod.Get,
                $"meetings/{meetingId}/recordings",
                null,
                "GetMeetingRecordings",
                sessionId,
                meetingId);

            var responseContent = await response.Content.ReadAsStringAsync();
            var zoomResponse = JsonSerializer.Deserialize<ZoomApiRecordingResponse>(responseContent);

            if (zoomResponse == null)
            {
                _logger.LogError(
                    "[AUDIT] Failed to deserialize Zoom recording response. SessionId: {SessionId}, MeetingId: {MeetingId}, Timestamp: {Timestamp}",
                    sessionId ?? "N/A",
                    meetingId,
                    DateTime.UtcNow);
                throw new BusinessException("Failed to retrieve video conference recording details. Please contact support.");
            }

            // Filter recording files to only include MP4 and TRANSCRIPT types
            var filteredFiles = zoomResponse.RecordingFiles?
                .Where(f => f.FileType == "MP4" || f.FileType == "TRANSCRIPT")
                .Select(f => new ZoomRecordingFileDto
                {
                    Id = f.Id ?? string.Empty,
                    FileType = f.FileType ?? string.Empty,
                    FileSize = f.FileSize,
                    PlayUrl = f.PlayUrl ?? string.Empty,
                    DownloadUrl = f.DownloadUrl ?? string.Empty,
                    RecordingStart = f.RecordingStart,
                    RecordingEnd = f.RecordingEnd,
                    Status = f.Status ?? string.Empty
                })
                .ToList() ?? new List<ZoomRecordingFileDto>();

            _logger.LogInformation(
                "[AUDIT] Successfully retrieved Zoom meeting recordings. SessionId: {SessionId}, MeetingId: {MeetingId}, " +
                "FileCount: {FileCount}, TotalSize: {TotalSize} bytes, Timestamp: {Timestamp}",
                sessionId ?? "N/A",
                meetingId,
                filteredFiles.Count,
                zoomResponse.TotalSize,
                DateTime.UtcNow);

            return new ZoomRecordingDto
            {
                MeetingId = zoomResponse.Id,
                Topic = zoomResponse.Topic ?? string.Empty,
                StartTime = zoomResponse.StartTime,
                Duration = zoomResponse.Duration,
                RecordingFiles = filteredFiles,
                TotalSize = zoomResponse.TotalSize
            };
        }

        /// <summary>
        /// Downloads a file from Zoom using the download URL (handling authentication)
        /// </summary>
        public async Task<Stream> DownloadFileStreamAsync(string downloadUrl, string? downloadAccessToken = null)
        {
            var client = _httpClientFactory.CreateClient();
            
            // Set a long timeout for large file downloads
            client.Timeout = TimeSpan.FromMinutes(30);
            
            // Get access token (from webhook or OAuth)
            var accessToken = !string.IsNullOrEmpty(downloadAccessToken) 
                ? downloadAccessToken 
                : await GetAccessTokenAsync();
            
            // Append access token to URL as query parameter (Zoom requirement)
            var urlWithToken = downloadUrl.Contains("?") 
                ? $"{downloadUrl}&access_token={accessToken}"
                : $"{downloadUrl}?access_token={accessToken}";

            try
            {
                var response = await client.GetAsync(urlWithToken, HttpCompletionOption.ResponseHeadersRead);
                // Use HttpCompletionOption.ResponseHeadersRead to avoid buffering the entire file in memory
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError(
                        "[AUDIT] Failed to download file from Zoom. Url: {Url}, StatusCode: {StatusCode}",
                        downloadUrl,
                        response.StatusCode);
                    throw new BusinessException($"Failed to download file from Zoom. Status: {response.StatusCode}");
                }

                return await response.Content.ReadAsStreamAsync();
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "[AUDIT] Network error while downloading file from Zoom. Url: {Url}", downloadUrl);
                throw new BusinessException("Unable to download file from video conferencing service.", ex);
            }
        }

        /// <summary>
        /// Generates a time-limited JWT access token for recording access
        /// </summary>
        public Task<string> GenerateRecordingAccessTokenAsync(string recordingId, string menteeId)
        {
            _logger.LogInformation(
                "Generating recording access token: RecordingId={RecordingId}, MenteeId={MenteeId}",
                recordingId,
                menteeId);

            // Generate JWT token with 15-minute expiration
            var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_zoomSettings.ClientSecret); // Use ClientSecret as signing key

            var tokenDescriptor = new Microsoft.IdentityModel.Tokens.SecurityTokenDescriptor
            {
                Subject = new System.Security.Claims.ClaimsIdentity(new[]
                {
                    new System.Security.Claims.Claim("recordingId", recordingId),
                    new System.Security.Claims.Claim("menteeId", menteeId),
                    new System.Security.Claims.Claim("type", "recording_access")
                }),
                Expires = DateTime.UtcNow.AddMinutes(15),
                SigningCredentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(
                    new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(key),
                    Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            _logger.LogInformation(
                "Successfully generated recording access token: RecordingId={RecordingId}, ExpiresAt={ExpiresAt}",
                recordingId,
                tokenDescriptor.Expires);

            return Task.FromResult(tokenString);
        }

        /// <summary>
        /// Updates meeting start/end times (Zoom branch compatibility).
        /// </summary>
        public async Task<bool> UpdateMeetingAsync(long meetingId, string? sessionId, DateTime newStartTime, DateTime newEndTime)
        {
            _logger.LogInformation(
                "[AUDIT] Updating Zoom meeting schedule. SessionId: {SessionId}, MeetingId: {MeetingId}, NewStart: {Start}, NewEnd: {End}",
                sessionId ?? "N/A", meetingId, newStartTime, newEndTime);

            var updateRequest = new
            {
                start_time = newStartTime.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                duration = (int)(newEndTime - newStartTime).TotalMinutes
            };

            var jsonContent = JsonSerializer.Serialize(updateRequest);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            await MakeAuthenticatedRequestWithRetryAsync(
                new HttpMethod("PATCH"),
                $"meetings/{meetingId}",
                content,
                "UpdateMeeting",
                sessionId,
                meetingId);

            _logger.LogInformation(
                "[AUDIT] Successfully updated Zoom meeting schedule. SessionId: {SessionId}, MeetingId: {MeetingId}",
                sessionId ?? "N/A",
                meetingId);

            return true;
        }

        /// <summary>
        /// Internal class for deserializing Zoom API meeting response
        /// </summary>
        private class ZoomApiMeetingResponse
        {
            [System.Text.Json.Serialization.JsonPropertyName("id")]
            public long Id { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("uuid")]
            public string? Uuid { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("topic")]
            public string? Topic { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("join_url")]
            public string? JoinUrl { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("start_url")]
            public string? StartUrl { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("password")]
            public string? Password { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("start_time")]
            public DateTime StartTime { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("duration")]
            public int Duration { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("status")]
            public string? Status { get; set; }
        }

        /// <summary>
        /// Internal class for deserializing Zoom API recording response
        /// </summary>
        private class ZoomApiRecordingResponse
        {
            [System.Text.Json.Serialization.JsonPropertyName("id")]
            public long Id { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("uuid")]
            public string? Uuid { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("topic")]
            public string? Topic { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("start_time")]
            public DateTime StartTime { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("duration")]
            public int Duration { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("total_size")]
            public long TotalSize { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("recording_files")]
            public List<ZoomApiRecordingFile>? RecordingFiles { get; set; }
        }

        /// <summary>
        /// Internal class for deserializing Zoom API recording file
        /// </summary>
        private class ZoomApiRecordingFile
        {
            [System.Text.Json.Serialization.JsonPropertyName("id")]
            public string? Id { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("file_type")]
            public string? FileType { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("file_size")]
            public long FileSize { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("play_url")]
            public string? PlayUrl { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("download_url")]
            public string? DownloadUrl { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("recording_start")]
            public DateTime RecordingStart { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("recording_end")]
            public DateTime RecordingEnd { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("status")]
            public string? Status { get; set; }
        }
    }
}
