using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.IO;
using System.Threading.Tasks;

namespace CareerRoute.Infrastructure.Services
{
    public class CloudflareR2Service : IBlobStorageService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly R2Settings _settings;
        private readonly ILogger<CloudflareR2Service> _logger;
        private static readonly TimeSpan MaxPresignedExpiration = TimeSpan.FromDays(7);

        public CloudflareR2Service(
            IOptions<R2Settings> settings,
            ILogger<CloudflareR2Service> logger)
        {
            _settings = settings.Value;
            _logger = logger;

            var credentials = new BasicAWSCredentials(_settings.AccessKey, _settings.SecretKey);
            var config = new AmazonS3Config
            {
                ServiceURL = $"https://{_settings.AccountId}.r2.cloudflarestorage.com",
                AuthenticationRegion = "auto",
                ForcePathStyle = true
            };

            _s3Client = new AmazonS3Client(credentials, config);
        }

        public async Task<string> UploadAsync(Stream stream, string fileName, string contentType, long? knownLength = null)
        {
            try
            {
                _logger.LogInformation("[R2] Starting upload for file: {FileName}", fileName);

                var putRequest = new PutObjectRequest
                {
                    InputStream = stream,
                    Key = fileName,
                    BucketName = _settings.BucketName,
                    ContentType = contentType,
                    DisablePayloadSigning = true,
                    AutoCloseStream = false
                };

                if (knownLength.HasValue)
                {
                    putRequest.Headers.ContentLength = knownLength.Value;
                }

                await _s3Client.PutObjectAsync(putRequest);

                _logger.LogInformation("[R2] Successfully uploaded file: {FileName}", fileName);
                return fileName;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[R2] Failed to upload file: {FileName}", fileName);
                throw;
            }
        }

        public async Task<string> UploadAsync(Stream stream, string fileName, string contentType, FileType fileType, long? knownLength = null)
        {
            var folder = GetFolderForFileType(fileType);
            var fullKey = $"{folder}/{fileName}";

            await UploadAsync(stream, fullKey, contentType, knownLength);
            return fullKey;
        }

        private string GetFolderForFileType(FileType fileType)
        {
            return fileType switch
            {
                FileType.Recording => _settings.RecordingsFolder,
                FileType.CV => _settings.CvsFolder,
                FileType.ProfilePicture => _settings.ProfilePicturesFolder,
                _ => throw new ArgumentOutOfRangeException(nameof(fileType))
            };
        }


        public async Task<string> GetPresignedUrlAsync(string fileName, TimeSpan? expiration = null, string? contentDisposition = null)
        {
            try
            {
                // Cap expiration at 7 days (R2/S3 maximum)
                var actualExpiration = expiration.HasValue 
                    ? (expiration.Value > MaxPresignedExpiration ? MaxPresignedExpiration : expiration.Value)
                    : MaxPresignedExpiration;

                var request = new GetPreSignedUrlRequest
                {
                    BucketName = _settings.BucketName,
                    Key = fileName,
                    Expires = DateTime.UtcNow.Add(actualExpiration),
                    Verb = HttpVerb.GET
                };

                if (!string.IsNullOrEmpty(contentDisposition))
                {
                    request.ResponseHeaderOverrides = new ResponseHeaderOverrides
                    {
                        ContentDisposition = contentDisposition
                    };
                }

                string url = await _s3Client.GetPreSignedURLAsync(request);
                _logger.LogInformation("[R2] Generated presigned URL for file: {FileName}, Expires: {Expiration}", fileName, actualExpiration);

                return url;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[R2] Failed to generate presigned URL for file: {FileName}", fileName);
                throw;
            }
        }

        public async Task DeleteAsync(string fileName)
        {
            try
            {
                _logger.LogInformation("[R2] Deleting file: {FileName}", fileName);

                var deleteRequest = new DeleteObjectRequest
                {
                    BucketName = _settings.BucketName,
                    Key = fileName
                };

                await _s3Client.DeleteObjectAsync(deleteRequest);

                _logger.LogInformation("[R2] Successfully deleted file: {FileName}", fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[R2] Failed to delete file: {FileName}", fileName);
                throw;
            }
        }
    }
}
