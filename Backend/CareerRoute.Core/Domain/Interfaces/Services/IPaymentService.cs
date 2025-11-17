using CareerRoute.Core.External.Payment;
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
        /// Gets the payment provider name
        /// </summary>
        string ProviderName { get; }
    }
}
