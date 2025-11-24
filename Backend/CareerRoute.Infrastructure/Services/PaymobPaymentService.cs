using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces.Services;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.External.Payment;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Settings;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace CareerRoute.Infrastructure.Services
{
    public class PaymobPaymentService : IPaymobPaymentService
    {
        private readonly PaymentSettings _paymentSettings;
        private readonly HttpClient _httpClient;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<PaymobPaymentService> _logger;
        private readonly IPaymentNotificationService _paymentNotificationService;

        public string ProviderName => "Paymob";

        public PaymobPaymentService(
            IOptions<PaymentSettings> paymentSettings,
            HttpClient httpClient,
            IConfiguration configuration,
            IWebHostEnvironment environment,
            ILogger<PaymobPaymentService> logger,
            IPaymentNotificationService paymentNotificationService)
        {
            _paymentSettings = paymentSettings?.Value ?? throw new ArgumentNullException(nameof(paymentSettings));
            _environment = environment ?? throw new ArgumentNullException(nameof(environment));
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _httpClient.BaseAddress = new Uri("https://accept.paymob.com/api/");
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _paymentNotificationService = paymentNotificationService;
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

            if (string.IsNullOrEmpty(_paymentSettings.Paymob.ApiKey))
                throw new BusinessException("Paymob API key is not configured");

            try
            {
                // Step 1: Get auth token
                var authToken = await GetAuthTokenAsync();

                // Step 2: Create order
                var intentId = await CreateOrderAsync(authToken, request);

                // Step 3: Get payment key
                var paymentKey = await GetPaymentKeyAsync(authToken, intentId, request);

                return new PaymentIntentResponse
                {
                    Success = true,
                    PaymentIntentId = intentId.ToString(),
                    ClientSecret = paymentKey,
                    Currency = request.Currency,
                    Amount = request.Amount,
                    PaymentMethod = _paymentSettings.Paymob.Provider,
                    PaymobPaymentMethod = request.PaymentMethod,
                };
            }
            catch (PaymentException)
            {
                throw; // Re-throw payment exceptions as-is
            }
            catch (ValidationException)
            {
                throw; // Re-throw validation exceptions as-is
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP request failed while creating Paymob payment intent");
                throw new PaymentException(
                    "Failed to communicate with Paymob payment gateway",
                    ProviderName,
                    ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error creating Paymob payment intent");
                throw new PaymentException(
                    "An unexpected error occurred while creating payment intent",
                    ProviderName,
                    ex);
            }
        }

        public PaymentCallbackResult HandleCallback(string payload, string? signature =null)
        {
            if (string.IsNullOrEmpty(payload))
                throw new ValidationException(new Dictionary<string, string[]>
            {
                { nameof(payload), new[] { "Callback payload cannot be empty" } }
            });

            try
            {
                var callbackData = JsonSerializer.Deserialize<PaymobCallbackRequest>(payload);

                if (callbackData?.Obj == null)
                    throw new PaymentException("Invalid callback data received from Paymob", ProviderName);

                // Verify HMAC if secret is provided
                if (!string.IsNullOrEmpty(_paymentSettings.Paymob.HmacSecret) && !string.IsNullOrEmpty(signature))
                {
                    var isValid = VerifyHmac(callbackData, signature);
                    if (!isValid)
                    {
                        _logger.LogWarning("Invalid HMAC signature for Paymob callback. PaymentId: {PaymentId}",
                            callbackData.Obj.Id);
                        throw new UnauthenticatedException("Invalid payment callback signature");
                    }
                }

                var status = callbackData.Obj.Success ? PaymentStatusOptions.Captured : PaymentStatusOptions.Failed;

                // Notify client via SignalR
                _paymentNotificationService.NotifyPaymentStatusAsync(callbackData.Obj.Order.Id.ToString(), status);

                return new PaymentCallbackResult
                {
                    Success = callbackData.Obj.Success,
                    PaymentIntentId = callbackData.Obj.Order.Id.ToString(),
                    TransactionId = callbackData.Obj.Id.ToString(),
                    OrderId = callbackData.Obj.Order.Id.ToString(),
                    Status = status,
                    Amount = callbackData.Obj.Amount_Cents / 100m,
                    Currency = callbackData.Obj.Currency,
                    ErrorMessage = callbackData.Obj.Success ? null: "Payment failed",
                    RawData = new Dictionary<string, object>
                {
                    { "paymob_data", callbackData }
                }
                };
            }
            catch (UnauthenticatedException)
            {
                throw; // Re-throw authentication exceptions
            }
            catch (PaymentException)
            {
                throw; // Re-throw payment exceptions
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Failed to deserialize Paymob callback payload");
                throw new PaymentException(
                    "Invalid callback payload format from Paymob",
                    ProviderName,
                    ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error handling Paymob callback");
                throw new PaymentException(
                    "Failed to process payment callback",
                    ProviderName,
                    ex);
            }
        }

        private async Task<string> GetAuthTokenAsync()
        {
            try
            {
                var content = new StringContent(
                    JsonSerializer.Serialize(new { api_key = _paymentSettings.Paymob.ApiKey }),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync("auth/tokens", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Paymob authentication failed. Status: {Status}, Response: {Response}",
                        response.StatusCode, errorContent);
                    throw new UnauthenticatedException("Failed to authenticate with Paymob. Please check your API credentials.");
                }

                var result = await response.Content.ReadAsStringAsync();
                var authResponse = JsonSerializer.Deserialize<PaymobAuthResponse>(result);

                if (authResponse == null || string.IsNullOrEmpty(authResponse.Token))
                    throw new PaymentException("Invalid authentication response from Paymob", ProviderName);

                return authResponse.Token;
            }
            catch (UnauthenticatedException)
            {
                throw;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP request failed during Paymob authentication");
                throw new PaymentException(
                    "Failed to connect to Paymob authentication service",
                    ProviderName,
                    ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during Paymob authentication");
                throw new PaymentException(
                    "Authentication with Paymob failed unexpectedly",
                    ProviderName,
                    ex);
            }
        }

        private async Task<int> CreateOrderAsync(string authToken, PaymentIntentRequest request)
        {
            try
            {
                var orderData = new
                {
                    auth_token = authToken,
                    delivery_needed = false,
                    amount_cents = (int)(request.Amount * 100),
                    currency = request.Currency,
                    merchant_order_id = $"{request.SessionId}_{Guid.NewGuid()}"
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(orderData),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync("ecommerce/orders", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Paymob order creation failed. Status: {Status}, Response: {Response}",
                        response.StatusCode, errorContent);
                    throw new PaymentException(
                        $"Failed to create order in Paymob. Status: {response.StatusCode}",
                        ProviderName);
                }

                var result = await response.Content.ReadAsStringAsync();
                var orderResponse = JsonSerializer.Deserialize<PaymobOrderResponse>(result);

                if (orderResponse == null || orderResponse.Id == 0)
                    throw new PaymentException("Invalid order response from Paymob", ProviderName);

                return orderResponse.Id;
            }
            catch (PaymentException)
            {
                throw;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP request failed during Paymob order creation");
                throw new PaymentException(
                    "Failed to create order with Paymob",
                    ProviderName,
                    ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during Paymob order creation");
                throw new PaymentException(
                    "Order creation failed unexpectedly",
                    ProviderName,
                    ex);
            }
        }

        private async Task<string> GetPaymentKeyAsync(string authToken, int orderId, PaymentIntentRequest request)
        {
            try
            {
                var integrationId = request.PaymentMethod switch
                {
                    PaymobPaymentMethodOptions.EWallet => _paymentSettings.Paymob.WalletIntegrationId,
                    PaymobPaymentMethodOptions.Card => _paymentSettings.Paymob.IntegrationId,
                    _ => _paymentSettings.Paymob.IntegrationId
                };

                if (string.IsNullOrEmpty(integrationId))
                    throw new BusinessException($"Paymob integration ID not configured for payment method: {request.PaymentMethod}");
                var paymentKeyData = new
                {
                    auth_token = authToken,
                    amount_cents = (int)(request.Amount * 100),
                    expiration = _paymentSettings.ExpirationMinutes * 60,
                    order_id = orderId,
                    billing_data = new
                    {
                        email = request.MenteeEmail ?? "customer@example.com",
                        first_name = request.MenteeFirstName ?? "NA",
                        last_name = request.MenteeLastName ?? "NA",
                        phone_number = request.MenteePhone ?? "NA",
                        apartment = "NA",
                        floor = "NA",
                        street = "NA",
                        building = "NA",
                        shipping_method = "NA",
                        postal_code = "NA",
                        city = "NA",
                        country = "NA",
                        state = "NA"
                    },
                    currency = request.Currency,
                    integration_id = int.Parse(integrationId)
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(paymentKeyData),
                    Encoding.UTF8,
                    "application/json"
                );

                var response = await _httpClient.PostAsync("acceptance/payment_keys", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Paymob payment key generation failed. Status: {Status}, Response: {Response}",
                        response.StatusCode, errorContent);
                    throw new PaymentException(
                        $"Failed to generate payment key from Paymob. Status: {response.StatusCode}",
                        ProviderName,
                        orderId.ToString());
                }

                var result = await response.Content.ReadAsStringAsync();
                var keyResponse = JsonSerializer.Deserialize<PaymobPaymentKeyResponse>(result);

                if (keyResponse == null || string.IsNullOrEmpty(keyResponse.Token))
                    throw new PaymentException("Invalid payment key response from Paymob", ProviderName, orderId.ToString());

                return keyResponse.Token;
            }
            catch (PaymentException)
            {
                throw;
            }
            catch (BusinessException)
            {
                throw;
            }
            catch (FormatException ex)
            {
                _logger.LogError(ex, "Invalid integration ID format for Paymob");
                throw new BusinessException("Invalid Paymob integration ID configuration", ex);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP request failed during Paymob payment key generation");
                throw new PaymentException(
                    "Failed to generate payment key with Paymob",
                    ProviderName,
                    ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during Paymob payment key generation");
                throw new PaymentException(
                    "Payment key generation failed unexpectedly",
                    ProviderName,
                    ex);
            }
        }

        private bool VerifyHmac(PaymobCallbackRequest callback, string receivedHmac)
        {
            try
            {
                var transaction = callback.Obj;
                var hmacSecret = _paymentSettings.Paymob.HmacSecret;

                if (string.IsNullOrEmpty(hmacSecret))
                {
                    _logger.LogWarning("HMAC Secret not configured for Paymob");
                    return false;
                }

                // Build concatenated string in Paymob's exact order
                var concatenatedString =
                    transaction.Amount_Cents.ToString() +
                    transaction.Created_At +
                    transaction.Currency +
                    transaction.Error_Occured.ToString().ToLower() +
                    transaction.Has_Parent_Transaction.ToString().ToLower() +
                    transaction.Id.ToString() +
                    transaction.Integration_Id.ToString() +
                    transaction.Is_3d_Secure.ToString().ToLower() +
                    transaction.Is_Auth.ToString().ToLower() +
                    transaction.Is_Capture.ToString().ToLower() +
                    transaction.Is_Refunded.ToString().ToLower() +
                    transaction.Is_Standalone_Payment.ToString().ToLower() +
                    transaction.Is_Voided.ToString().ToLower() +
                    transaction.Order.Id.ToString() +
                    transaction.Owner.ToString() +
                    transaction.Pending.ToString().ToLower() +
                    (transaction.Source_Data?.Pan ?? "null") +
                    (transaction.Source_Data?.Sub_Type ?? "null") +
                    (transaction.Source_Data?.Type ?? "null") +
                    transaction.Success.ToString().ToLower();

                // Calculate HMAC-SHA512
                using (var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(hmacSecret)))
                {
                    var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(concatenatedString));
                    var calculatedHmac = BitConverter.ToString(hash).Replace("-", "").ToLower();

                    if (string.IsNullOrEmpty(receivedHmac))
                    {
                        _logger.LogInformation("No HMAC received - this is normal for test transactions");

                        if (_environment.IsDevelopment())
                        {
                            _logger.LogWarning("Bypassing HMAC verification in development environment");
                            return true; // Only in development!
                        }

                        return false;
                    }

                    return calculatedHmac == receivedHmac.ToLower();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "HMAC Verification Error for Paymob callback");
                return false;
            }
        }

        public async Task<PaymentRefundResponse> RefundAsync(string paymentIntentId, decimal amount, string? transactionId = null)
        {
            if (string.IsNullOrEmpty(transactionId))
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    { nameof(transactionId), new[] { "Transaction ID is required for Paymob refund" } }
                });

            try
            {
                // Step 1: Get auth token
                var authToken = await GetAuthTokenAsync();

                // Step 2: Prepare refund request
                var refundRequest = new
                {
                    auth_token = authToken,
                    transaction_id = transactionId,
                    amount_cents = (int)(amount * 100)
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(refundRequest),
                    Encoding.UTF8,
                    "application/json"
                );

                // Step 3: Call Paymob refund API
                var response = await _httpClient.PostAsync("acceptance/void_refund/refund", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Paymob refund failed. Status: {Status}, Response: {Response}",
                        response.StatusCode, errorContent);
                    throw new PaymentException(
                        $"Failed to refund payment with Paymob. Status: {response.StatusCode}",
                        ProviderName);
                }

                var result = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(result);
                var root = doc.RootElement;

                // Paymob returns the transaction object directly
                var success = root.GetProperty("success").GetBoolean();
                var id = root.GetProperty("id").GetInt32();
                var amountCents = root.GetProperty("amount_cents").GetInt32();

                if (!success)
                    throw new PaymentException("Paymob refund request was not successful", ProviderName);

                return new PaymentRefundResponse
                {
                    Success = true,
                    TransactionId = id.ToString(),
                    RefundedAmount = amountCents / 100m,
                    Currency = "EGP" // Paymob usually defaults to EGP
                };
            }
            catch (PaymentException)
            {
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error processing Paymob refund");
                throw new PaymentException(
                    "Failed to process refund with Paymob",
                    ProviderName,
                    ex);
            }
        }
    }

}
