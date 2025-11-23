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
        Task CheckAndCancelPaymentAsync(string paymentId);

        /// <summary>
        /// Refunds a payment by a specific percentage
        /// </summary>
        /// <param name="paymentId">The payment ID</param>
        /// <param name="percentage">The percentage to refund (1-100)</param>
        /// <returns>Refund details</returns>
        Task<PaymentRefundResponseDto> RefundPaymentAsync(string paymentId, decimal percentage);
    }
}
