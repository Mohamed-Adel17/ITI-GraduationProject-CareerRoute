using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.Domain.Interfaces.Services;
using CareerRoute.Core.DTOs;
using CareerRoute.Core.DTOs.Payments;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Extentions;
using CareerRoute.Core.External.Payment;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Settings;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Hangfire;

namespace CareerRoute.Core.Services.Implementations
{
    public class PaymentProcessingService : IPaymentProcessingService
    {
        private readonly IPaymentRepository _paymentRepository;
        private readonly ISessionRepository _sessionRepository;
        private readonly IMentorRepository _mentorRepository;
        private readonly ITimeSlotRepository _timeSlotRepository;
        private readonly IEmailService _emailService;
        private readonly IPaymentFactory _paymentFactory;
        private readonly ILogger<PaymentProcessingService> _logger;
        private readonly IValidator<PaymentIntentRequestDto> _paymentIntentValidator;
        private readonly IValidator<PaymentConfirmRequestDto> _paymentConfirmValidator;
        private readonly IMapper _mapper;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly PaymentSettings _paymentSettings;
        private readonly IPaymentNotificationService _paymentNotificationService;
        private readonly IEmailTemplateService _emailTemplateService;


        public PaymentProcessingService(
            IPaymentRepository paymentRepository,
            ISessionRepository sessionRepository,
            IMentorRepository mentorRepository,
            ITimeSlotRepository timeSlotRepository,
            IEmailService emailService,
            IPaymentFactory paymentFactory,
            IOptions<PaymentSettings> paymentSettings,
            ILogger<PaymentProcessingService> logger,
            IValidator<PaymentIntentRequestDto> paymentIntentValidator,
            IValidator<PaymentConfirmRequestDto> paymentConfirmValidator,
            UserManager<ApplicationUser> userManager,
            IMapper mapper,
            IPaymentNotificationService paymentNotificationService,
            IEmailTemplateService emailTemplateService)
        {
            _paymentRepository = paymentRepository;
            _sessionRepository = sessionRepository;
            _mentorRepository = mentorRepository;
            _timeSlotRepository = timeSlotRepository;
            _emailService = emailService;
            _paymentFactory = paymentFactory;
            _paymentSettings = paymentSettings?.Value ?? throw new ArgumentNullException(nameof(paymentSettings));
            _logger = logger;
            _paymentIntentValidator = paymentIntentValidator;
            _paymentConfirmValidator = paymentConfirmValidator;
            _userManager = userManager;
            _mapper = mapper;
            _paymentNotificationService = paymentNotificationService;
            _emailTemplateService = emailTemplateService;
        }

        public async Task<PaymentIntentResponseDto> CreatePaymentIntentAsync(PaymentIntentRequestDto request, string userId)
        {

            await _paymentIntentValidator.ValidateAndThrowCustomAsync(request);
            // Get session details
            var session = await _sessionRepository.GetByIdAsync(request.SessionId);
            if (session is null)
                throw new NotFoundException("Session", request.SessionId);

            if (session.Status != SessionStatusOptions.Pending)
                throw new BusinessException($"Cannot create payment for session with status: {session.Status}");
            if (session.PaymentId is not null)
                throw new ConflictException("Session already has a payment associated");
            if (session.MenteeId != userId)
                throw new UnauthorizedException($"Access Denied");

            var mentor = await _mentorRepository.GetMentorWithUserByIdAsync(session.MentorId);
            if (mentor is null)
                throw new NotFoundException("Mentor", session.MentorId);
            var mentee = await _userManager.FindByIdAsync(session.MenteeId);
            if (mentee is null)
                throw new NotFoundException("Mentee", session.MenteeId);



            // Determine currency based on provider
            var currency = request.PaymentProvider == PaymentProviderOptions.Stripe ? "USD" : "EGP";
            decimal amount = request.PaymentProvider == PaymentProviderOptions.Stripe
                ? Math.Round((session.Price / 50m) , 2) 
                : session.Price;

            // Get the appropriate payment service
            var paymentService = _paymentFactory.GetService(request.PaymentProvider);

            // Create payment intent request
            var paymentIntentRequest = new PaymentIntentRequest
            {
                Amount = amount,
                Currency = currency,
                SessionId = request.SessionId,
                MenteeEmail = mentee.Email,
                MenteeFirstName = mentee.FirstName,
                MenteeLastName = mentee.LastName,
                MenteePhone = mentee.PhoneNumber,
                PaymentMethod = request.PaymobPaymentMethod
            };

            // Call payment provider
            var providerResponse = await paymentService.CreatePaymentIntentAsync(paymentIntentRequest);

            if (!providerResponse.Success)
                throw new PaymentException(
                    providerResponse.ErrorMessage ?? "Failed to create payment intent",
                    paymentService.ProviderName);

            // Create payment record
            var payment = new Payment
            {
                Id = Guid.NewGuid().ToString(),
                SessionId = request.SessionId,
                MenteeId = mentee.Id,
                PaymentProvider = request.PaymentProvider,
                PaymobPaymentMethod = request.PaymobPaymentMethod,
                PaymentIntentId = providerResponse.PaymentIntentId ?? string.Empty,
                ClientSecret = providerResponse.ClientSecret ?? string.Empty,
                Amount = amount,
                Currency = providerResponse.Currency ?? currency,
                Status = PaymentStatusOptions.Pending,
                PlatformCommission = 0.15m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            await using var transaction = await _paymentRepository.BeginTransactionAsync();
            try
            {
                await _paymentRepository.AddAsync(payment);

                session.PaymentId = payment.Id;
                _sessionRepository.Update(session);

                await _paymentRepository.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation(
                    "Payment intent created. PaymentId: {PaymentId}, SessionId: {SessionId}, Provider: {Provider}",
                    payment.Id, request.SessionId, paymentService.ProviderName);
            }
            catch
            {
                await transaction.RollbackAsync();
                _logger.LogError("Failed to create payment intent for session {SessionId}", request.SessionId);
                throw;
            }

            BackgroundJob.Schedule<IPaymentProcessingService>(
                x => x.CheckAndCancelPaymentAsync(payment.Id),
                TimeSpan.FromMinutes(_paymentSettings.ExpirationMinutes));
            return new PaymentIntentResponseDto
            {
                PaymentIntentId = payment.PaymentIntentId,
                ClientSecret = payment.ClientSecret,
                Amount = payment.Amount,
                Currency = payment.Currency,
                SessionId = payment.SessionId,
                PaymentProvider = payment.PaymentProvider,
                PaymobPaymentMethod = payment.PaymobPaymentMethod,
                Status = payment.Status
            };
        }

        public async Task<PaymentRefundResponseDto> ProcessRefundAsync(Payment payment, decimal percentage)
        {
            if (payment == null)
                throw new ArgumentNullException(nameof(payment));

            if (percentage <= 0 || percentage > 100)
                throw new BusinessException("Refund percentage must be between 1 and 100");

            if (payment.Status != PaymentStatusOptions.Captured)
                throw new BusinessException($"Cannot refund payment with status: {payment.Status}. Only captured payments can be refunded.");

            if (payment.IsRefunded && payment.RefundPercentage >= 100)
                throw new BusinessException("Payment is already fully refunded");

            // Calculate refund amount
            var refundAmount = payment.Amount * (percentage / 100m);

            var paymentService = _paymentFactory.GetService(payment.PaymentProvider);

            // Call provider
            var refundResponse = await paymentService.RefundAsync(payment.PaymentIntentId, refundAmount, payment.ProviderTransactionId);

            if (!refundResponse.Success)
                throw new PaymentException(refundResponse.ErrorMessage ?? "Refund failed", paymentService.ProviderName);

            // Update payment record (without saving - caller will handle transaction)
            payment.IsRefunded = true;
            payment.RefundAmount = (payment.RefundAmount ?? 0) + refundResponse.RefundedAmount;
            payment.RefundPercentage = (payment.RefundPercentage ?? 0) + percentage;
            payment.RefundStatus = RefundStatus.Completed;
            payment.Status = PaymentStatusOptions.Refunded;
            payment.RefundedAt = DateTime.UtcNow;
            payment.UpdatedAt = DateTime.UtcNow;

            _paymentRepository.Update(payment);

            _logger.LogInformation(
                "Payment refund processed. PaymentId: {PaymentId}, Amount: {Amount}, Percentage: {Percentage}%",
                payment.Id, refundResponse.RefundedAmount, percentage);

            // Notify client via SignalR
            await _paymentNotificationService.NotifyPaymentStatusAsync(payment.PaymentIntentId, payment.Status);

            return new PaymentRefundResponseDto
            {
                PaymentId = payment.Id,
                RefundAmount = refundResponse.RefundedAmount,
                RefundPercentage = percentage,
                Status = payment.Status,
                RefundedAt = payment.RefundedAt.Value
            };
        }

        public async Task<PaymentRefundResponseDto> RefundPaymentAsync(string paymentId, decimal percentage)
        {
            if (percentage <= 0 || percentage > 100)
                throw new BusinessException("Refund percentage must be between 1 and 100");

            var payment = await _paymentRepository.GetByIdAsync(paymentId);
            if (payment == null)
                throw new NotFoundException("Payment", paymentId);

            if (payment.Status != PaymentStatusOptions.Captured)
                throw new BusinessException($"Cannot refund payment with status: {payment.Status}. Only captured payments can be refunded.");

            if (payment.IsRefunded && payment.RefundPercentage >= 100)
                throw new BusinessException("Payment is already fully refunded");

            // Calculate refund amount
            var refundAmount = payment.Amount * (percentage / 100m);

            // Check if previous partial refunds exist (if you support multiple partial refunds, logic would be more complex)
            // For now, assuming simple refund logic or single refund per payment for simplicity unless specified otherwise.
            // But let's handle the case where we might want to check total refunded amount if we were to support multiple.
            // Current requirement is "refund by percentage", implying a single action or cumulative. 
            // Let's assume this action sets the refund state.

            var paymentService = _paymentFactory.GetService(payment.PaymentProvider);

            // Call provider
            var refundResponse = await paymentService.RefundAsync(payment.PaymentIntentId, refundAmount, payment.ProviderTransactionId);

            if (!refundResponse.Success)
                throw new PaymentException(refundResponse.ErrorMessage ?? "Refund failed", paymentService.ProviderName);

            // Update payment record
            payment.IsRefunded = true;
            payment.RefundAmount = (payment.RefundAmount ?? 0) + refundResponse.RefundedAmount;
            payment.RefundPercentage = (payment.RefundPercentage ?? 0) + percentage;
            payment.RefundStatus = RefundStatus.Completed;
            payment.Status = PaymentStatusOptions.Refunded;
            payment.RefundedAt = DateTime.UtcNow;
            payment.UpdatedAt = DateTime.UtcNow;


            _paymentRepository.Update(payment);
            await _paymentRepository.SaveChangesAsync();

            _logger.LogInformation(
                "Payment refunded. PaymentId: {PaymentId}, Amount: {Amount}, Percentage: {Percentage}%",
                payment.Id, refundResponse.RefundedAmount, percentage);

            // Notify client via SignalR
            await _paymentNotificationService.NotifyPaymentStatusAsync(payment.PaymentIntentId, payment.Status);

            return new PaymentRefundResponseDto
            {
                PaymentId = payment.Id,
                RefundAmount = refundResponse.RefundedAmount,
                RefundPercentage = percentage,
                Status = payment.Status,
                RefundedAt = payment.RefundedAt.Value
            };
        }

        public async Task HandleStripeWebhookAsync(string payload, string signature)
        {
            var stripeService = _paymentFactory.GetService(PaymentProviderOptions.Stripe);
            var callbackResult = stripeService.HandleCallback(payload, signature);

            await ProcessPaymentCallbackAsync(callbackResult, "Stripe");
            await _paymentRepository.SaveChangesAsync();
        }

        public async Task HandlePaymobWebhookAsync(string payload, string signature)
        {
            var paymobService = _paymentFactory.GetService(PaymentProviderOptions.Paymob);
            var callbackResult = paymobService.HandleCallback(payload, signature);

            await ProcessPaymentCallbackAsync(callbackResult, "Paymob");
            await _paymentRepository.SaveChangesAsync();
        }

        public async Task<PaymentConfirmResponseDto> ConfirmPaymentAsync(PaymentConfirmRequestDto request)
        {
            await _paymentConfirmValidator.ValidateAndThrowCustomAsync(request);


            // Get payment by intent ID
            var payment = await _paymentRepository.GetByPaymentIntentIdAsync(request.PaymentIntentId);
            if (payment == null)
                throw new NotFoundException("Payment", request.PaymentIntentId);
            var paymentService = _paymentFactory.GetService(payment.PaymentProvider);

            // Verify payment is not already confirmed
            if (payment.Session.Status == SessionStatusOptions.Confirmed)
                throw new ConflictException("Session has already been confirmed");
            // Verify payment is already Captured
            if (payment.Status != PaymentStatusOptions.Captured)
            {
                // Double check with provider
                var (providerStatus, providerTransactionId) = await paymentService.GetPaymentStatusAsync(payment.PaymentIntentId);

                if (providerStatus == PaymentStatusOptions.Captured&& providerTransactionId!=null)
                {
                    payment.Status = PaymentStatusOptions.Captured;
                    payment.ProviderTransactionId = providerTransactionId;
                    payment.PaidAt = DateTime.UtcNow;
                    _logger.LogInformation("Payment {PaymentId} status recovered from provider as Captured", payment.Id);
                }
                else
                {
                    throw new PaymentException($"Payment must be captured before it can be confirmed. Current status: {payment.Status}, Provider status: {providerStatus}");
                }
            }



            // Get session
            var session = payment.Session ??
                          await _sessionRepository.GetByIdAsync(payment.SessionId);
            if (session == null)
                throw new NotFoundException("Session", payment.SessionId);


            // Verify payment status with provider (implementation depends on your provider SDK)
            await VerifyPaymentWithProviderAsync(paymentService, payment.PaymentIntentId);

            var currency = payment.PaymentProvider == PaymentProviderOptions.Stripe ? "USD" : "EGP";
            decimal expectedAmount = payment.PaymentProvider == PaymentProviderOptions.Stripe
                ? Math.Round((session.Price / 50m) , 2) 
                : session.Price;
            // Validate payment amount matches session price
            if (payment.Amount != expectedAmount || payment.Currency != currency)
            {
                _logger.LogWarning(
                    "Payment amount mismatch. Payment: {PaymentAmount}, Session: {SessionPrice}",
                    payment.Amount, session.Price);
                throw new BusinessException("Payment amount does not match session price");
            }

            // Calculate commission
            var platformCommission = payment.Amount * payment.PlatformCommission;
            var mentorPayout = payment.Amount * (1 - payment.PlatformCommission);

            using var transaction = await _paymentRepository.BeginTransactionAsync();

            try
            {
                // Update payment status
                payment.UpdatedAt = DateTime.UtcNow;
                payment.PaymentReleaseDate = DateTime.UtcNow.AddHours(72); // Release after 72 hours
                _paymentRepository.Update(payment);

                // Update session status
                session.Status = SessionStatusOptions.Confirmed;
                session.UpdatedAt = DateTime.UtcNow;

                // Generate video conference link
                session.VideoConferenceLink = await GenerateVideoConferenceLinkAsync(session);
                _sessionRepository.Update(session);

                await _paymentRepository.SaveChangesAsync();

                // Commit transaction
                await transaction.CommitAsync();

                _logger.LogInformation(
                    "Payment confirmed. PaymentId: {PaymentId}, SessionId: {SessionId}, Amount: {Amount}",
                    payment.Id, session.Id, payment.Amount);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();

                _logger.LogError(ex,
                    "Error confirming payment. PaymentId: {PaymentId}, SessionId: {SessionId}",
                    payment.Id, session.Id);

                throw;
            }
            // Get mentor details for email
            var mentor = await _mentorRepository.GetMentorWithUserByIdAsync(session.MentorId);
            if (mentor == null)
                throw new NotFoundException("Mentor", session.MentorId);
            var mentee = await _userManager.FindByIdAsync(session.MenteeId);
            if (mentee is null)
                throw new NotFoundException("Mentee", session.MenteeId);



            // Send confirmation emails
            await SendConfirmationEmailsAsync(session, payment, mentor, mentee);

            _logger.LogInformation(
                "Payment confirmed. PaymentId: {PaymentId}, SessionId: {SessionId}, Amount: {Amount}",
                payment.Id, session.Id, payment.Amount);

            // Notify client via SignalR
            await _paymentNotificationService.NotifyPaymentStatusAsync(payment.PaymentIntentId, PaymentStatusOptions.Captured);

            return _mapper.Map<PaymentConfirmResponseDto>(payment);
        }

        public async Task<PaymentHistoryResponseDto> GetPaymentHistoryAsync(
            string userId,
            int page = 1,
            int pageSize = 10,
            PaymentStatusOptions? status = null)
        {


            var payments = await _paymentRepository.GetPaymentHistoryWithSessionAsync(
                userId, page, pageSize, status);
            if (payments.Count() == 0) throw new NotFoundException("you don't have any payment history ");
            var totalCount = await _paymentRepository.GetPaymentHistoryCountAsync(userId, status);
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
            var mentorIds = payments.Select(p => p.Session.MentorId).Distinct();
            Dictionary<string, Mentor> mentors = [];
            foreach (var mentorId in mentorIds)
            {
                mentors[mentorId] = (await _mentorRepository.GetMentorWithUserByIdAsync(mentorId))!;
            }

            foreach (var payment in payments)
                payment.Session.Mentor = mentors[payment.Session.MentorId];

            var paymentDtos = _mapper.Map<IEnumerable<PaymentHistroyItemResponseDto>>(payments);

            return new PaymentHistoryResponseDto
            {
                Payments = paymentDtos,
                PaginationMetadata = new PaginationMetadataDto
                {
                    CurrentPage = page,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = totalPages,
                    HasNextPage = page < totalPages,
                    HasPreviousPage = page > 1
                }
                ,
                Summary = CalculatePaymentSummary(payments)
            };
        }

        public async Task<PaymentHistroyItemResponseDto> GetPaymentByIdAsync(string paymentId)
        {
            if (string.IsNullOrEmpty(paymentId))
                throw new BusinessException("Payment ID must be send");

            var payment = await _paymentRepository.GetByIdAsync(paymentId);
            if (payment == null)
                throw new NotFoundException("Payment", paymentId);

            var session = await _sessionRepository.GetByIdAsync(payment.SessionId);
            payment.Session = session!;
            var mentor = await _mentorRepository.GetMentorWithUserByIdAsync(session!.MentorId);
            payment.Session.Mentor = mentor!;
            return _mapper.Map<PaymentHistroyItemResponseDto>(payment);
        }

        public async Task CheckAndCancelPaymentAsync(string paymentId)
        {
            _logger.LogInformation("[Payment] Checking if payment {PaymentId} should be cancelled", paymentId);

            await using var transaction = await _paymentRepository.BeginTransactionAsync();
            try
            {
                var payment = await _paymentRepository.GetByIdAsync(paymentId);
                if (payment == null)
                {
                    _logger.LogWarning("[Payment] Payment {PaymentId} not found for cancellation check", paymentId);
                    return;
                }

                // Only cancel if payment is still pending or failed
                if (payment.Status == PaymentStatusOptions.Pending || payment.Status == PaymentStatusOptions.Failed)
                {
                    // Double check with provider before cancelling
                    var paymentService = _paymentFactory.GetService(payment.PaymentProvider);
                    var (providerStatus, transactionId) = await paymentService.GetPaymentStatusAsync(payment.PaymentIntentId);

                    if (providerStatus == PaymentStatusOptions.Captured)
                    {
                        payment.Status = PaymentStatusOptions.Captured;
                        payment.PaidAt = DateTime.UtcNow;
                        if (!string.IsNullOrEmpty(transactionId))
                        {
                            payment.ProviderTransactionId = transactionId;
                        }
                        payment.UpdatedAt = DateTime.UtcNow;
                        _paymentRepository.Update(payment);
                        await _paymentRepository.SaveChangesAsync();
                        await transaction.CommitAsync();

                        _logger.LogInformation("[Payment] Payment {PaymentId} status recovered from provider as Captured during cancellation check", payment.Id);
                        
                        // Notify client via SignalR
                        await _paymentNotificationService.NotifyPaymentStatusAsync(payment.PaymentIntentId, PaymentStatusOptions.Captured);
                        return;
                    }

                    // Cancel with payment provider if Stripe
                    if (payment.PaymentProvider == PaymentProviderOptions.Stripe)
                    {
                        try
                        {
                            var stripeService = (IStripePaymentService)_paymentFactory.GetService(PaymentProviderOptions.Stripe);
                            await stripeService.CancelPaymentIntentAsync(payment.PaymentIntentId);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "[Payment] Failed to cancel Stripe payment intent {PaymentIntentId}", payment.PaymentIntentId);
                        }
                    }

                    payment.Status = PaymentStatusOptions.Canceled;
                    payment.UpdatedAt = DateTime.UtcNow;
                    payment.CancelledAt = DateTime.UtcNow;
                    _paymentRepository.Update(payment);
                    await _paymentRepository.SaveChangesAsync();

                    // Also cancel the associated session and free timeslot
                    var session = await _sessionRepository.GetByIdAsync(payment.SessionId);
                    if (session != null && session.Status == SessionStatusOptions.Pending)
                    {
                        var timeSlotId = session.TimeSlotId;

                        session.Status = SessionStatusOptions.Cancelled;
                        session.CancellationReason = "Payment not captured within allowed time";
                        session.TimeSlotId = null;
                        session.UpdatedAt = DateTime.UtcNow;

                        _sessionRepository.Update(session);
                        await _sessionRepository.SaveChangesAsync();

                        // Free the TimeSlot
                        if (!string.IsNullOrEmpty(timeSlotId))
                        {
                            var timeSlot = await _timeSlotRepository.GetByIdAsync(timeSlotId);
                            if (timeSlot != null)
                            {
                                timeSlot.IsBooked = false;
                                timeSlot.SessionId = null;
                                _timeSlotRepository.Update(timeSlot);
                                await _timeSlotRepository.SaveChangesAsync();
                            }
                        }
                    }

                    await transaction.CommitAsync();

                    _logger.LogInformation("[Payment] Payment {PaymentId} and associated session automatically cancelled due to expiration", paymentId);
                    
                    // Notify client via SignalR
                    await _paymentNotificationService.NotifyPaymentStatusAsync(payment.PaymentIntentId, PaymentStatusOptions.Canceled);
                }
                else
                {
                    _logger.LogInformation("[Payment] Payment {PaymentId} not cancelled. Status: {Status}", paymentId, payment.Status);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Payment] Error cancelling payment {PaymentId}", paymentId);
                await transaction.RollbackAsync();
                throw;
            }
        }

        // ==================== Private Helper Methods ====================

        private async Task ProcessPaymentCallbackAsync(PaymentCallbackResult callbackResult, string provider)
        {
            try
            {
                if (!callbackResult.Success)
                {
                    _logger.LogWarning(
                        "Payment failed via {Provider}. OrderId: {OrderId}, Error: {Error}",
                        provider, callbackResult.OrderId, callbackResult.ErrorMessage);

                    await UpdatePaymentStatusAsync(
                        callbackResult.PaymentIntentId,
                        callbackResult.Status,
                        callbackResult.TransactionId);
                    return;
                }

                // Update payment with transaction details
                var payment = await _paymentRepository.GetByPaymentIntentIdAsync(callbackResult.PaymentIntentId);
                if (payment == null)
                {
                    _logger.LogError(
                        "Payment not found for intent ID: {PaymentIntentId} from {Provider}",
                        callbackResult.PaymentIntentId, provider);
                    return;
                }

                payment.Status = callbackResult.Status;
                payment.ProviderTransactionId = callbackResult.TransactionId;
                payment.UpdatedAt = DateTime.UtcNow;

                if (callbackResult.Status == PaymentStatusOptions.Captured)
                {
                    payment.PaidAt = DateTime.UtcNow;
                    payment.PaymentReleaseDate = DateTime.UtcNow.AddHours(72);
                }

                _paymentRepository.Update(payment);

                _logger.LogInformation(
                    "Payment webhook processed successfully. Provider: {Provider}, PaymentId: {PaymentId}, Status: {Status}",
                    provider, payment.Id, payment.Status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payment callback from {Provider}", provider);
                throw new PaymentException($"Failed to process {provider} webhook", provider, ex);
            }
        }

        private async Task UpdatePaymentStatusAsync(
            string paymentIntentId,
            PaymentStatusOptions status,
            string transactionId)
        {
            var payment = await _paymentRepository.GetByPaymentIntentIdAsync(paymentIntentId);
            if (payment != null)
            {
                payment.Status = status;
                payment.ProviderTransactionId = transactionId;
                payment.UpdatedAt = DateTime.UtcNow;
                _paymentRepository.Update(payment);
            }
        }
        public PaymentHistorySummaryDto CalculatePaymentSummary(IEnumerable<Payment> payments)
        {
            if (payments == null || payments.Count() == 0)
                return new PaymentHistorySummaryDto();

            // Total spent = sum of all successful payments
            var totalSpent = payments
                .Where(p => p.Status == PaymentStatusOptions.Captured)
                .Sum(p => p.Amount);

            // Total refunded = sum of all refund amounts
            var totalRefunded = payments
                .Where(p => (p.Status == PaymentStatusOptions.Refunded || p.IsRefunded) && p.RefundAmount.HasValue)
                .Sum(p => p.RefundAmount ?? 0);

            // Net spent = spent - refunded
            var netSpent = totalSpent - totalRefunded;

            return new PaymentHistorySummaryDto
            {
                TotalSpent = totalSpent,
                TotalRefunded = totalRefunded,
                NetSpent = netSpent
            };
        }


        private async Task VerifyPaymentWithProviderAsync(IPaymentService paymentService, string paymentIntentId)
        {
            // This would call the provider's API to verify the payment status
            // Implementation depends on your payment provider SDK
            // For now, we trust the webhook callback
            // In production, you should verify with the provider's API

            _logger.LogInformation(
                "Payment verification requested for intent: {PaymentIntentId} with provider: {Provider}",
                paymentIntentId, paymentService.ProviderName);

            await Task.CompletedTask;
        }

        private async Task<string> GenerateVideoConferenceLinkAsync(Session session)
        {
            // TODO: Integrate with Zoom API or your preferred video conferencing service
            // For now, return a placeholder
            var meetingId = Guid.NewGuid().ToString("N").Substring(0, 10);
            var VideoConferenceLink = $"https://zoom.us/j/{meetingId}";

            _logger.LogInformation(
                "Generated video conference link for session: {SessionId}, Link: {Link}",
                session.Id, VideoConferenceLink);

            return await Task.FromResult(VideoConferenceLink);
        }

        private async Task SendConfirmationEmailsAsync(Session session, Payment payment, Mentor mentor, ApplicationUser mentee)
        {
            try
            {
                // 1. Send email to mentee
                var menteeSubject = "Session Confirmed - Payment Successful";
                var menteeEmailHtmlBody = _emailTemplateService.GenerateMenteeConfirmationEmailBody(session, payment, mentor, mentee);

                await _emailService.SendEmailAsync(
                    mentee.Email!,
                    menteeSubject,
                    menteeEmailHtmlBody.HtmlToString(),
                    menteeEmailHtmlBody); // Assuming the last argument is for plain text body, using HTML for simplicity

                // 2. Send email to mentor
                var mentorSubject = "New Session Booked";
                var mentorEmailHtmlBody = _emailTemplateService.GenerateMentorConfirmationEmailBody(session, payment, mentor, mentee);

                await _emailService.SendEmailAsync(
                    mentor.User.Email!,
                    mentorSubject,
                    mentorEmailHtmlBody.HtmlToString(),
                    mentorEmailHtmlBody); // Assuming the last argument is for plain text body, using HTML for simplicity

                _logger.LogInformation(
                    "Confirmation emails sent for session: {SessionId}",
                    session.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send confirmation emails for session: {SessionId}", session.Id);
            }
        }

    }
}
