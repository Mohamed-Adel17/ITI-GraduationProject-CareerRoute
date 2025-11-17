using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Payments;

namespace CareerRoute.Core.Services.Interfaces
{
    public interface IPaymentProcessingService
    {
        /// Creates a payment intent for a session
        /// </summary>
        Task<PaymentIntentResponseDto> CreatePaymentIntentAsync(PaymentIntentRequestDto request,string userId);

        /// <summary>
        /// Handles Stripe webhook callbacks
        /// </summary>
        Task HandleStripeWebhookAsync(string payload, string signature);

        /// <summary>
        /// Handles Paymob webhook callbacks
        /// </summary>
        Task HandlePaymobWebhookAsync(string payload, string signature );

        /// <summary>
        /// Confirms payment and completes session booking
        /// </summary>
        Task<PaymentConfirmResponseDto> ConfirmPaymentAsync(PaymentConfirmRequestDto request);

        /// <summary>
        /// Gets payment history with filtering and pagination
        /// </summary>
        Task<PaymentHistoryResponseDto> GetPaymentHistoryAsync(
            string userId,
            int page,
            int pageSize,
            PaymentStatusOptions? status = null);

        /// <summary>
        /// Gets a single payment by ID
        /// </summary>
        Task<PaymentHistroyItemResponseDto> GetPaymentByIdAsync(string paymentId);
    }
}
