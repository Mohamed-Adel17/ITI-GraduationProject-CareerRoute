using System.IO;
using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Interfaces
{
    public interface IDeepgramService
    {
        /// <summary>
        /// Transcribes an audio stream using Deepgram Whisper Cloud
        /// </summary>
        /// <param name="audioStream">The audio file stream</param>
        /// <param name="mimeType">The MIME type of the audio file (e.g., "audio/mp4", "audio/m4a")</param>
        /// <returns>The transcribed text</returns>
        Task<string> TranscribeAudioStreamAsync(Stream audioStream, string mimeType);

        /// <summary>
        /// Transcribes an audio file from a URL using Deepgram Whisper Cloud
        /// </summary>
        /// <param name="audioUrl">The public or presigned URL of the audio file</param>
        /// <returns>The transcribed text</returns>
        Task<string> TranscribeAudioUrlAsync(string audioUrl);
    }
}
