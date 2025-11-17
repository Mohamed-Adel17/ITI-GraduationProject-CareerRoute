using CareerRoute.API.Models;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Payments;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CareerRoute.API.Controllers
{
    [Route("api/payments")]
    [ApiController]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentProcessingService _paymentService;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(
            IPaymentProcessingService paymentService,
            ILogger<PaymentController> logger)
        {
            _paymentService = paymentService;
            _logger = logger;
        }

            /// <summary>
            /// Create a payment intent for a session
            /// </summary>
            /// <param name="request">Payment intent request details</param>
            /// <returns>Payment intent response with client secret</returns>
            [HttpPost("create-intent")]
            [ProducesResponseType(typeof(ApiResponse<PaymentIntentResponseDto>), StatusCodes.Status201Created)]
            [ProducesResponseType(StatusCodes.Status400BadRequest)]
            [ProducesResponseType(StatusCodes.Status401Unauthorized)]
            [ProducesResponseType(StatusCodes.Status404NotFound)]
            public async Task<ActionResult<ApiResponse<PaymentIntentResponseDto>>> CreatePaymentIntent(
                [FromBody] PaymentIntentRequestDto request)
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? throw new UnauthenticatedException("User not authenticated");

                var result = await _paymentService.CreatePaymentIntentAsync(request, userId);
                
                return CreatedAtAction(
                    nameof(GetPaymentById),
                    new { paymentId = result.PaymentIntentId },
                    new ApiResponse<PaymentIntentResponseDto>(result, "Payment intent created successfully"));
            }

            /// <summary>
            /// Confirm a payment after client-side processing
            /// </summary>
            /// <param name="request">Payment confirmation request</param>
            /// <returns>Payment confirmation response</returns>
            [HttpPost("confirm")]
            [ProducesResponseType(typeof(ApiResponse<PaymentConfirmResponseDto>), StatusCodes.Status200OK)]
            [ProducesResponseType(StatusCodes.Status400BadRequest)]
            [ProducesResponseType(StatusCodes.Status404NotFound)]
            [ProducesResponseType(StatusCodes.Status409Conflict)]
            public async Task<ActionResult<ApiResponse<PaymentConfirmResponseDto>>> ConfirmPayment(
                [FromBody] PaymentConfirmRequestDto request)
            {
                var result = await _paymentService.ConfirmPaymentAsync(request);
                return Ok(new ApiResponse<PaymentConfirmResponseDto>(result, "Payment confirmed successfully. Your session is now booked!"));
            }

            /// <summary>
            /// Get payment history for the authenticated user
            /// </summary>
            /// <param name="page">Page number (default: 1)</param>
            /// <param name="pageSize">Page size (default: 10)</param>
            /// <param name="status">Filter by payment status</param>
            /// <returns>Paginated payment history</returns>
            [HttpGet("history")]
            [ProducesResponseType(typeof(ApiResponse<PaymentHistoryResponseDto>), StatusCodes.Status200OK)]
            [ProducesResponseType(StatusCodes.Status401Unauthorized)]
            public async Task<ActionResult<PaymentHistoryResponseDto>> GetPaymentHistory(
                [FromQuery] int page = 1,
                [FromQuery] int pageSize = 10,
                [FromQuery] PaymentStatusOptions? status = null)
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? throw new UnauthenticatedException("User not authenticated");

                var result = await _paymentService.GetPaymentHistoryAsync(userId, page, pageSize, status);
                return Ok(new ApiResponse<PaymentHistoryResponseDto>(result, "Payment history retrieved successfully"));
            }

            /// <summary>
            /// Get a specific payment by ID
            /// </summary>
            /// <param name="paymentId">Payment ID</param>
            /// <returns>Payment details</returns>
            [HttpGet("{paymentId}")]
            [ProducesResponseType(typeof(ApiResponse<PaymentHistroyItemResponseDto>), StatusCodes.Status200OK)]
            [ProducesResponseType(StatusCodes.Status400BadRequest)]
            [ProducesResponseType(StatusCodes.Status404NotFound)]
            public async Task<ActionResult<PaymentHistroyItemResponseDto>> GetPaymentById(string paymentId)
            {
                var result = await _paymentService.GetPaymentByIdAsync(paymentId);
                return Ok(new ApiResponse<PaymentHistroyItemResponseDto> { Data = result });
            }

        }
}
