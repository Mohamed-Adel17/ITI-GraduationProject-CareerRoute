using CareerRoute.Core.DTOs.Deepgram;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace CareerRoute.Infrastructure.Services
{
    public class DeepgramService : IDeepgramService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly DeepgramSettings _deepgramSettings;
        private readonly ILogger<DeepgramService> _logger;

        public DeepgramService(
            IHttpClientFactory httpClientFactory,
            IOptions<DeepgramSettings> deepgramSettings,
            ILogger<DeepgramService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _deepgramSettings = deepgramSettings.Value;
            _logger = logger;
        }

        public async Task<string> TranscribeAudioStreamAsync(Stream audioStream, string mimeType)
        {
            if (string.IsNullOrEmpty(_deepgramSettings.ApiKey))
            {
                _logger.LogError("[Deepgram] API Key is missing in configuration.");
                throw new BusinessException("Deepgram API Key is not configured.");
            }

            _logger.LogInformation("[Deepgram] Starting transcription (Model: whisper-large)");

            try
            {
                using var client = _httpClientFactory.CreateClient();
                var apiKey = _deepgramSettings.ApiKey?.Trim();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Token", apiKey);
                client.Timeout = TimeSpan.FromMinutes(5); // Increased timeout for large files

                // Deepgram API parameters
                var query = "model=whisper-large&smart_format=true&diarize=true&paragraphs=true&utterances=true";
                var url = $"https://api.deepgram.com/v1/listen?{query}";

                // Log masked key for debugging
                var keyPrefix = !string.IsNullOrEmpty(apiKey) && apiKey.Length > 4 ? apiKey.Substring(0, 4) : "null";
                _logger.LogInformation("[Deepgram] Request Config - Url: {Url}, KeyPrefix: {KeyPrefix}***", url, keyPrefix);

                using var content = new StreamContent(audioStream);
                content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);

                _logger.LogInformation("[Deepgram] Sending POST request...");
                var response = await client.PostAsync(url, content);

                return await ProcessDeepgramResponseAsync(response);
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogError(ex, "[Deepgram] Request timed out.");
                throw new TimeoutException("Deepgram transcription request timed out. Please try again later.", ex);
            }
        }

        public async Task<string> TranscribeAudioUrlAsync(string audioUrl)
        {
            if (string.IsNullOrEmpty(_deepgramSettings.ApiKey))
            {
                _logger.LogError("[Deepgram] API Key is missing in configuration.");
                throw new BusinessException("Deepgram API Key is not configured.");
            }

            _logger.LogInformation("[Deepgram] Starting URL transcription (Model: whisper-large)");

            try
            {
                using var client = _httpClientFactory.CreateClient();
                var apiKey = _deepgramSettings.ApiKey?.Trim();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Token", apiKey);
                
                // Deepgram API parameters
                var query = "model=whisper-large&smart_format=true&diarize=true&paragraphs=true&utterances=true";
                var url = $"https://api.deepgram.com/v1/listen?{query}";

                var payload = new { url = audioUrl };
                var jsonContent = JsonSerializer.Serialize(payload);
                using var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                _logger.LogInformation("[Deepgram] Sending POST request with URL payload...");
                var response = await client.PostAsync(url, content);

                return await ProcessDeepgramResponseAsync(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Deepgram] Failed to transcribe from URL.");
                throw;
            }
        }

        private async Task<string> ProcessDeepgramResponseAsync(HttpResponseMessage response)
        {
            _logger.LogInformation("[Deepgram] Received response. Status: {Status}", response.StatusCode);

            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("[Deepgram] API failed. Status: {Status}, Response: {Response}", response.StatusCode, responseBody);
                throw new HttpRequestException($"Deepgram API failed with status {response.StatusCode}. Details: {responseBody}");
            }

            try 
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var resultDto = JsonSerializer.Deserialize<DeepgramResponseDto>(responseBody, options);

                if (resultDto?.Results?.Channels != null && resultDto.Results.Channels.Count > 0)
                {
                    var firstChannel = resultDto.Results.Channels[0];
                    
                    // Prefer Utterances for speaker diarization
                    if (resultDto.Results.Utterances != null && resultDto.Results.Utterances.Count > 0)
                    {
                        var readableText = new StringBuilder();
                        foreach (var utterance in resultDto.Results.Utterances)
                        {
                            readableText.AppendLine($"[{TimeSpan.FromSeconds(utterance.Start):mm\\:ss}] Speaker {utterance.Speaker}: {utterance.Transcript}");
                        }

                        var transcript = readableText.ToString();
                        _logger.LogInformation("[Deepgram] Transcription completed via Utterances. Length: {Length}", transcript.Length);
                        return transcript;
                    }
                    // Fallback to simple transcript
                    else if (firstChannel.Alternatives != null && firstChannel.Alternatives.Count > 0)
                    {
                        var transcript = firstChannel.Alternatives[0].Transcript;
                        _logger.LogInformation("[Deepgram] Transcription completed via Alternatives. Length: {Length}", transcript?.Length ?? 0);
                        return transcript ?? string.Empty;
                    }
                }

                _logger.LogWarning("[Deepgram] Response parsed but no transcript found.");
                return string.Empty;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "[Deepgram] Failed to deserialize response.");
                throw new InvalidOperationException("Failed to process Deepgram response.", ex);
            }
        }
    }
}
