using System;
using System.IO;
using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Interfaces
{
    /// <summary>
    /// Interface for cloud blob storage operations (e.g., Cloudflare R2, AWS S3)
    /// </summary>
    public interface IBlobStorageService
    {
        /// <summary>
        /// Uploads a stream to the blob storage
        /// </summary>
        /// <param name="stream">The file stream to upload</param>
        /// <param name="fileName">The target file name (key)</param>
        /// <param name="contentType">The MIME type of the file</param>
        /// <param name="knownLength">Optional known length of the stream (useful for non-seekable streams)</param>
        /// <returns>The storage key (file name)</returns>
        Task<string> UploadAsync(Stream stream, string fileName, string contentType, long? knownLength = null);

        /// <summary>
        /// Generates a temporary presigned URL for accessing the file
        /// </summary>
        /// <param name="fileName">The file name (key)</param>
        /// <param name="expiration">How long the URL should remain valid</param>
        /// <returns>The public or presigned URL</returns>
        string GetPresignedUrl(string fileName, TimeSpan expiration, string? contentDisposition = null);

        /// <summary>
        /// Deletes a file from storage
        /// </summary>
        /// <param name="fileName">The file name (key) to delete</param>
        Task DeleteAsync(string fileName);
    }
}
