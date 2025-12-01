using CareerRoute.Core.External.Payment;
using CareerRoute.Core.Domain.Enums;
namespace CareerRoute.Core.Domain.Interfaces.Services
{
    public interface IPaymentService
    {
        /// <summary>
        /// Creates a payment intent with the payment provider
        /// </summary>
        /// <param name="request">Payment intent request details</param>
        /// <returns>Payment intent response with client secret and payment URL</returns>
        Task<PaymentIntentResponse> CreatePaymentIntentAsync(PaymentIntentRequest request);

        /// <summary>
        /// Handles payment callback/webhook from the payment provider
        /// </summary>
        /// <param name="payload">Raw callback payload from provider</param>
        /// <param name="signature">Signature header for verification (if applicable)</param>
        /// <returns>Processed payment callback result</returns>
        PaymentCallbackResult HandleCallback(string payload, string? signature = null);

        /// <summary>
        /// Refunds a payment by a specific amount
        /// </summary>
        /// <param name="paymentIntentId">The payment intent ID to refund</param>
        /// <param name="amount">The amount to refund</param>
        /// <returns>Refund response details</returns>
        Task<PaymentRefundResponse> RefundAsync(string paymentIntentId, decimal amount, string? transactionId = null);

        /// <summary>
        /// Gets the current status of a payment from the provider
        /// </summary>
        /// <param name="paymentIntentId">The payment intent ID</param>
        /// <returns>The current payment status</returns>
        Task<(PaymentStatusOptions Status, string? ProviderTransactionId)> GetPaymentStatusAsync(string paymentIntentId);

        /// <summary>
        /// Gets the payment provider name
        /// </summary>
        string ProviderName { get; }
    }
}
