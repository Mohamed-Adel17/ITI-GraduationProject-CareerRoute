using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Threading.Tasks;

namespace CareerRoute.API.Controllers
{
    /// <summary>
    /// Temporary controller for testing R2 and Deepgram integration.
    /// REMOVE IN PRODUCTION.
    /// </summary>
    [Route("api/test/cloud")]
    [ApiController]
    public class CloudIntegrationTestController : ControllerBase
    {
        private readonly IBlobStorageService _blobStorageService;
        private readonly IDeepgramService _deepgramService;
        private readonly ILogger<CloudIntegrationTestController> _logger;

        public CloudIntegrationTestController(
            IBlobStorageService blobStorageService,
            IDeepgramService deepgramService,
            ILogger<CloudIntegrationTestController> logger)
        {
            _blobStorageService = blobStorageService;
            _deepgramService = deepgramService;
            _logger = logger;
        }

        [HttpPost("upload-r2")]
        public async Task<IActionResult> TestR2Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file provided");

            try
            {
                var key = $"test/{Guid.NewGuid()}_{file.FileName}";
                
                using var stream = file.OpenReadStream();
                var uploadedKey = await _blobStorageService.UploadAsync(stream, key, file.ContentType);
                var url =await _blobStorageService.GetPresignedUrlAsync(uploadedKey, TimeSpan.FromMinutes(10));

                return Ok(new { Key = uploadedKey, PresignedUrl = url });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "R2 Upload Test Failed");
                return StatusCode(500, ex.Message);
            }
        }

        [HttpPost("transcribe-r2-flow")]
        public async Task<IActionResult> TestR2DeepgramFlow(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file provided");

            try
            {
                // 1. Upload to R2
                var key = $"test-transcribe/{Guid.NewGuid()}_{file.FileName}";
                using var stream = file.OpenReadStream();
                await _blobStorageService.UploadAsync(stream, key, file.ContentType);
                _logger.LogInformation("Uploaded test file to R2: {Key}", key);

                // 2. Generate Presigned URL
                var presignedUrl =await _blobStorageService.GetPresignedUrlAsync(key, TimeSpan.FromMinutes(60));
                _logger.LogInformation("Generated R2 Presigned URL");

                // 3. Send URL to Deepgram
                var transcript = await _deepgramService.TranscribeAudioUrlAsync(presignedUrl);
                
                return Ok(new 
                { 
                    Key = key, 
                    PresignedUrl = presignedUrl,
                    TranscriptLength = transcript.Length,
                    Transcript = transcript 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Deepgram R2 Flow Test Failed");
                return StatusCode(500, ex.Message);
            }
        }
    }
}
