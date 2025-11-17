using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces.Services;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.External.Payment;
using CareerRoute.Core.Settings;
using Microsoft.Extensions.Options;
using Stripe;
namespace CareerRoute.Infrastructure.Services
{
    public class StripePaymentService : IStripePaymentService
    {
        private readonly PaymentSettings _paymentSettings;

        public string ProviderName => _paymentSettings.Stripe.Provider ?? "Stripe";

        public StripePaymentService(IOptions<PaymentSettings> paymentSettings)
        {
            _paymentSettings = paymentSettings?.Value ?? throw new ArgumentNullException(nameof(paymentSettings));

            if (string.IsNullOrEmpty(_paymentSettings.Stripe.SecretKey))
                throw new BusinessException("Stripe secret key is not configured");

            StripeConfiguration.ApiKey = _paymentSettings.Stripe.SecretKey;
        }

        public async Task<PaymentIntentResponse> CreatePaymentIntentAsync(PaymentIntentRequest request)
        {
            if (request == null)
                throw new ValidationException(new Dictionary<string, string[]>
            {
                { nameof(request), new[] { "Payment request cannot be null" } }
            });

            if (request.Amount <= 0)
                throw new ValidationException(new Dictionary<string, string[]>
            {
                { nameof(request.Amount), new[] { "Amount must be greater than zero" } }
            });

            if (string.IsNullOrEmpty(request.Currency))
                throw new ValidationException(new Dictionary<string, string[]>
            {
                { nameof(request.Currency), new[] { "Currency is required" } }
            });

            try
            {
                var options = new PaymentIntentCreateOptions
                {
                    Amount = (long)(request.Amount * 100), // Stripe uses cents
                    Currency = request.Currency.ToLower(),
                    Metadata = new Dictionary<string, string>
                {
                    { "order_id", request.SessionId }
                },
                    ReceiptEmail = request.MenteeEmail,
                    AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                    {
                        Enabled = true,
                    }
                };

                var service = new PaymentIntentService();
                var intent = await service.CreateAsync(options);

                if (intent == null)
                    throw new PaymentException("Failed to create payment intent with Stripe", ProviderName);

                return new PaymentIntentResponse
                {
                    Success = true,
                    PaymentIntentId = intent.Id,
                    ClientSecret = intent.ClientSecret,
                    Amount = intent.Amount / 100m,
                    Currency = intent.Currency.ToUpper(),
                    PaymentMethod = intent.PaymentMethodTypes.FirstOrDefault(),
                };
            }
            catch (StripeException ex)
            {
                throw ex.StripeError?.Type switch
                {
                    "card_error" => new PaymentException(
                        $"Card error: {ex.Message}",
                        ProviderName,
                        ex),
                    "invalid_request_error" => new ValidationException(new Dictionary<string, string[]>
                {
                    { "stripe_error", new[] { ex.Message } }
                }),
                    "api_error" => new PaymentException(
                        "Stripe API error occurred. Please try again later.",
                        ProviderName,
                        ex),
                    "authentication_error" => new UnauthenticatedException(
                        "Invalid Stripe API credentials"),
                    "rate_limit_error" => new PaymentException(
                        "Too many requests to Stripe. Please try again later.",
                        ProviderName,
                        ex),
                    _ => new PaymentException(
                        $"Stripe payment failed: {ex.Message}",
                        ProviderName,
                        ex)
                };
            }
            catch (ValidationException)
            {
                throw; // Re-throw validation exceptions as-is
            }
            catch (Exception ex)
            {
                throw new PaymentException(
                    "An unexpected error occurred while creating Stripe payment intent",
                    ProviderName,
                    ex);
            }
        }

        public PaymentCallbackResult HandleCallback(string payload, string? signature)
        {
            if (string.IsNullOrEmpty(payload))
                throw new ValidationException(new Dictionary<string, string[]>
            {
                { nameof(payload), new[] { "Webhook payload cannot be empty" } }
            });

            if (string.IsNullOrEmpty(signature))
                throw new ValidationException(new Dictionary<string, string[]>
            {
                { nameof(signature), new[] { "Webhook signature cannot be empty" } }
            });

            if (string.IsNullOrEmpty(_paymentSettings.Stripe.WebhookSecret))
                throw new BusinessException("Stripe webhook secret is not configured");

            try
            {
                var stripeEvent = EventUtility.ConstructEvent(
                    payload,
                    signature,
                    _paymentSettings.Stripe.WebhookSecret
                );

                if (stripeEvent == null)
                    throw new PaymentException("Failed to construct Stripe webhook event", ProviderName);

                return stripeEvent.Type switch
                {
                    "payment_intent.succeeded" => HandlePaymentIntentSucceeded(stripeEvent),
                    "payment_intent.payment_failed" => HandlePaymentIntentFailed(stripeEvent),
                    "payment_intent.canceled" => HandlePaymentIntentCanceled(stripeEvent),
                    _ => new PaymentCallbackResult
                    {
                        Success = false,
                        ErrorMessage = $"Unhandled Stripe event type: {stripeEvent.Type}"
                    }
                };
            }
            catch (StripeException ex)
            {
                if (ex.Message.Contains("signature"))
                {
                    throw new UnauthenticatedException("Invalid Stripe webhook signature");
                }
                throw new PaymentException(
                    $"Stripe webhook processing failed: {ex.Message}",
                    ProviderName,
                    ex);
            }
            catch (PaymentException)
            {
                throw; // Re-throw payment exceptions
            }
            catch (ValidationException)
            {
                throw; // Re-throw validation exceptions
            }
            catch (UnauthenticatedException)
            {
                throw; // Re-throw authentication exceptions
            }
            catch (Exception ex)
            {
                throw new PaymentException(
                    "Failed to process Stripe webhook",
                    ProviderName,
                    ex);
            }
        }

        private PaymentCallbackResult HandlePaymentIntentSucceeded(Event stripeEvent)
        {
            var paymentIntent = stripeEvent.Data.Object as PaymentIntent;

            if (paymentIntent == null)
                throw new PaymentException("Invalid payment intent data in webhook", ProviderName);

            return new PaymentCallbackResult
            {
                Success = true,
                PaymentIntentId = paymentIntent.Id,
                TransactionId = paymentIntent.Id,
                OrderId = paymentIntent.Metadata.GetValueOrDefault("order_id") ?? string.Empty,
                Status = PaymentStatusOptions.Captured,
                Amount = paymentIntent.Amount / 100m,
                Currency = paymentIntent.Currency.ToUpper(),
                RawData = new Dictionary<string, object>
            {
                { "stripe_event", stripeEvent.Type },
                { "payment_method", paymentIntent.PaymentMethodTypes.FirstOrDefault() ?? "unknown" }
            }
            };
        }

        private PaymentCallbackResult HandlePaymentIntentFailed(Event stripeEvent)
        {
            var paymentIntent = stripeEvent.Data.Object as PaymentIntent;

            if (paymentIntent == null)
                throw new PaymentException("Invalid payment intent data in webhook", ProviderName);

            return new PaymentCallbackResult
            {
                Success = false,
                PaymentIntentId = paymentIntent.Id,
                TransactionId = paymentIntent.Id,
                OrderId = paymentIntent.Metadata.GetValueOrDefault("order_id") ?? string.Empty,
                Status = PaymentStatusOptions.Failed,
                Amount = paymentIntent.Amount / 100m,
                Currency = paymentIntent.Currency.ToUpper(),
                ErrorMessage = paymentIntent.LastPaymentError?.Message ?? "Payment failed",
                RawData = new Dictionary<string, object>
            {
                { "stripe_event", stripeEvent.Type },
                { "failure_code", paymentIntent.LastPaymentError?.Code ?? "unknown" }
            }
            };
        }

        private PaymentCallbackResult HandlePaymentIntentCanceled(Event stripeEvent)
        {
            var paymentIntent = stripeEvent.Data.Object as PaymentIntent;

            if (paymentIntent == null)
                throw new PaymentException("Invalid payment intent data in webhook", ProviderName);

            return new PaymentCallbackResult
            {
                Success = false,
                PaymentIntentId = paymentIntent.Id,
                TransactionId = paymentIntent.Id,
                OrderId = paymentIntent.Metadata.GetValueOrDefault("order_id") ?? string.Empty,
                Status = PaymentStatusOptions.Failed,
                Amount = paymentIntent.Amount / 100m,
                Currency = paymentIntent.Currency.ToUpper(),
                ErrorMessage = "Payment was canceled",
                RawData = new Dictionary<string, object>
            {
                { "stripe_event", stripeEvent.Type },
                { "cancellation_reason", paymentIntent.CancellationReason ?? "unknown" }
            }
            };
        }
    }
}
