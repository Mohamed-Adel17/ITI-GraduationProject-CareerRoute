using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.Domain.Interfaces.Services;
using CareerRoute.Core.DTOs.Payments;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.External.Payment;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Settings;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Stripe;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CareerRoute.Infrastructure.Services
{
    /// <summary>
    /// Stripe payment provider implementation.
    /// </summary>
    public class StripePaymentService : IStripePaymentService
    {
        private readonly PaymentSettings _paymentSettings;
        private readonly IPaymentNotificationService _paymentNotificationService;

        public string ProviderName => _paymentSettings.Stripe.Provider ?? "Stripe";

        public StripePaymentService(IOptions<PaymentSettings> paymentSettings, IPaymentNotificationService paymentNotificationService)
        {
            _paymentSettings = paymentSettings?.Value ?? throw new ArgumentNullException(nameof(paymentSettings));
            _paymentNotificationService = paymentNotificationService;

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
                throw;
            }
            catch (Exception ex)
            {
                throw new PaymentException(
                    "An unexpected error occurred while creating Stripe payment intent",
                    ProviderName,
                    ex);
            }
        }

        public async Task<PaymentIntentResponse> CancelPaymentIntentAsync(string paymentIntentId)
        {
            try
            {
                var service = new PaymentIntentService();
                var intent = await service.CancelAsync(paymentIntentId);

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
                throw new PaymentException(
                    $"Failed to cancel Stripe payment intent: {ex.Message}",
                    ProviderName,
                    ex);
            }
        }

        public async Task<PaymentRefundResponse> RefundAsync(string paymentIntentId, decimal amount, string? transactionId = null)
        {
            try
            {
                var options = new RefundCreateOptions
                {
                    PaymentIntent = paymentIntentId,
                    Amount = (long)(amount * 100), // Stripe uses cents
                };

                var service = new RefundService();
                var refund = await service.CreateAsync(options);

                return new PaymentRefundResponse
                {
                    Success = true,
                    TransactionId = refund.Id,
                    RefundedAmount = refund.Amount / 100m,
                    Currency = refund.Currency.ToUpper()
                };
            }
            catch (StripeException ex)
            {
                throw new PaymentException(
                    $"Failed to refund Stripe payment: {ex.Message}",
                    ProviderName,
                    ex);
            }
        }

        public async Task<(PaymentStatusOptions Status, string? ProviderTransactionId)> GetPaymentStatusAsync(string paymentIntentId)
        {
            try
            {
                var service = new PaymentIntentService();
                var intent = await service.GetAsync(paymentIntentId);

                var status = intent.Status switch
                {
                    "succeeded" => PaymentStatusOptions.Captured,
                    "requires_payment_method" => PaymentStatusOptions.Failed,
                    "requires_confirmation" => PaymentStatusOptions.Pending,
                    "processing" => PaymentStatusOptions.Pending,
                    "canceled" => PaymentStatusOptions.Canceled,
                    _ => PaymentStatusOptions.Pending
                };

                return (status, intent.Id);
            }
            catch (StripeException ex)
            {
                throw new PaymentException(
                    $"Failed to get Stripe payment status: {ex.Message}",
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
                throw;
            }
            catch (ValidationException)
            {
                throw;
            }
            catch (UnauthenticatedException)
            {
                throw;
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

            _paymentNotificationService.NotifyPaymentStatusAsync(paymentIntent.Id, PaymentStatusOptions.Captured);

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

            _paymentNotificationService.NotifyPaymentStatusAsync(paymentIntent.Id, PaymentStatusOptions.Failed);

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

            _paymentNotificationService.NotifyPaymentStatusAsync(paymentIntent.Id, PaymentStatusOptions.Canceled);

            return new PaymentCallbackResult
            {
                Success = false,
                PaymentIntentId = paymentIntent.Id,
                TransactionId = paymentIntent.Id,
                OrderId = paymentIntent.Metadata.GetValueOrDefault("order_id") ?? string.Empty,
                Status = PaymentStatusOptions.Canceled,
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

    /// <summary>
    /// Coordinates payment confirmation with session Zoom meeting creation.
    /// </summary>
    public class PaymentService : IPaymentService
    {
        private readonly IBaseRepository<Payment> _paymentRepository;
        private readonly IBaseRepository<Session> _sessionRepository;
        private readonly ISessionService _sessionService;
        private readonly ILogger<PaymentService> _logger;

        public PaymentService(
            IBaseRepository<Payment> paymentRepository,
            IBaseRepository<Session> sessionRepository,
            ISessionService sessionService,
            ILogger<PaymentService> logger)
        {
            _paymentRepository = paymentRepository;
            _sessionRepository = sessionRepository;
            _sessionService = sessionService;
            _logger = logger;
        }

        /// <summary>
        /// Confirms a payment and triggers Zoom meeting creation for the associated session.
        /// </summary>
        public async Task<PaymentConfirmResponseDto> ConfirmPaymentAsync(PaymentConfirmRequestDto request)
        {
            _logger.LogInformation(
                "Starting payment confirmation for PaymentIntentId: {PaymentIntentId}, SessionId: {SessionId}",
                request.PaymentIntentId, request.SessionId);

            var session = await _sessionRepository.GetByIdAsync(request.SessionId);
            if (session == null)
            {
                _logger.LogError("Session not found: {SessionId}", request.SessionId);
                throw new NotFoundException("Session", request.SessionId);
            }

            var payment = (await _paymentRepository.GetAllAsync())
                .FirstOrDefault(p => p.PaymentIntentId == request.PaymentIntentId);

            if (payment == null)
            {
                _logger.LogError("Payment not found for PaymentIntentId: {PaymentIntentId}", request.PaymentIntentId);
                throw new NotFoundException($"Payment intent {request.PaymentIntentId} not found");
            }

            if (payment.Status == PaymentStatusOptions.Captured)
            {
                _logger.LogWarning("Payment {PaymentId} has already been processed", payment.Id);
                throw new BusinessException("Payment has already been processed");
            }

            if (payment.SessionId != request.SessionId)
            {
                _logger.LogError("Payment {PaymentId} does not belong to session {SessionId}", payment.Id, request.SessionId);
                throw new BusinessException("Payment does not belong to the specified session");
            }

            payment.Status = PaymentStatusOptions.Captured;
            payment.UpdatedAt = DateTime.UtcNow;
            payment.PaymentReleaseDate = DateTime.UtcNow.AddHours(72);

            _paymentRepository.Update(payment);
            await _paymentRepository.SaveChangesAsync();

            _logger.LogInformation("Payment {PaymentId} confirmed successfully. Status updated to Captured.", payment.Id);

            try
            {
                _logger.LogInformation("Initiating Zoom meeting creation for session {SessionId} after payment confirmation", request.SessionId);
                await _sessionService.CreateZoomMeetingForSessionAsync(request.SessionId);
                _logger.LogInformation("Zoom meeting creation completed for session {SessionId}", request.SessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error during Zoom meeting creation for session {SessionId}. Payment confirmation succeeded; meeting creation may need intervention.",
                    request.SessionId);
            }

            session = await _sessionRepository.GetByIdAsync(request.SessionId)
                ?? throw new NotFoundException("Session", request.SessionId);

            return new PaymentConfirmResponseDto
            {
                PaymentId = payment.Id,
                SessionId = session.Id,
                Amount = payment.Amount,
                PlatformCommission = payment.Amount * payment.PlatformCommission,
                MentorPayoutAmount = payment.MentorPayoutAmount,
                PaymentMethod = payment.PaymentMethod,
                Status = payment.Status.ToString(),
                TransactionId = payment.ProviderTransactionId ?? payment.PaymentIntentId,
                PaidAt = payment.UpdatedAt
            };
        }
    }
}
