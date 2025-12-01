using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
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
                    AutoCloseStream = false // Important: let the caller manage the stream lifecycle
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

        public string GetPresignedUrl(string fileName, TimeSpan expiration, string? contentDisposition = null)
        {
            try
            {
                var request = new GetPreSignedUrlRequest
                {
                    BucketName = _settings.BucketName,
                    Key = fileName,
                    Expires = DateTime.UtcNow.Add(expiration),
                    Verb = HttpVerb.GET
                };

                if (!string.IsNullOrEmpty(contentDisposition))
                {
                    request.ResponseHeaderOverrides = new ResponseHeaderOverrides
                    {
                        ContentDisposition = contentDisposition
                    };
                }

                string url = _s3Client.GetPreSignedURL(request);
                _logger.LogInformation("[R2] Generated presigned URL for file: {FileName}, Expires: {Expiration}, Disposition: {Disposition}", fileName, expiration, contentDisposition ?? "Default");
                
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
