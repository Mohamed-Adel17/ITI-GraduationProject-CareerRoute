using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CareerRoute.API.Controllers.WebHooks
{

    /// <summary>
    /// Handles payment provider webhooks (Stripe, Paymob, etc.)
    /// This controller does NOT require authentication as it receives callbacks from external services
    /// </summary>
    [ApiController]
    [Route("api/webhooks/payments")]
    public class PaymentWebhooksController : ControllerBase
    {
        private readonly IPaymentProcessingService _paymentService;
        private readonly ILogger<PaymentWebhooksController> _logger;

        public PaymentWebhooksController(
            IPaymentProcessingService paymentService,
            ILogger<PaymentWebhooksController> logger)
        {
            _paymentService = paymentService;
            _logger = logger;
        }

        /// <summary>
        /// Stripe webhook endpoint for payment events
        /// </summary>
        /// <returns>200 OK if webhook processed successfully</returns>
        [HttpPost("stripe")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> StripeWebhook()
        {
            try
            {
                var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
                var stripeSignature = Request.Headers["Stripe-Signature"].ToString();

                if (string.IsNullOrEmpty(stripeSignature))
                {
                    _logger.LogWarning("Stripe webhook received without signature");
                    return BadRequest("Missing Stripe signature");
                }

                await _paymentService.HandleStripeWebhookAsync(json, stripeSignature);

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Stripe webhook");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Paymob webhook endpoint for payment events
        /// </summary>
        /// <returns>200 OK if webhook processed successfully</returns>
        [HttpPost("paymob")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> PaymobWebhook()
        {
            try
            {
                var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();

                // Paymob might use a different header name for signature/HMAC
                var paymobSignature = Request.Headers["X-Paymob-Signature"].ToString();
                //var paymobSignature = Request.Query["hmac"].ToString(); 

                if (string.IsNullOrEmpty(paymobSignature))
                {
                    _logger.LogWarning("Paymob webhook received without signature");
                    // Some providers might not require signature, adjust based on Paymob's requirements
                }

                await _paymentService.HandlePaymobWebhookAsync(json, paymobSignature);

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing Paymob webhook");
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Generic webhook endpoint for testing
        /// </summary>
        [HttpPost("test")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public IActionResult TestWebhook([FromBody] object payload)
        {
            _logger.LogInformation("Test webhook received: {Payload}", payload);
            return Ok(new { message = "Webhook received successfully", timestamp = DateTime.UtcNow });
        }
    }
}
