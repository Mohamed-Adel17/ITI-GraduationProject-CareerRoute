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

namespace CareerRoute.Core.Services.Implementations
{
    public class PaymentProcessingService : IPaymentProcessingService
    {
        private readonly IPaymentRepository _paymentRepository;
        private readonly ISessionRepository _sessionRepository;
        private readonly IMentorRepository _mentorRepository;
        private readonly IEmailService _emailService;
        private readonly IPaymentFactory _paymentFactory;
        private readonly ILogger<PaymentProcessingService> _logger;
        private readonly IValidator<PaymentIntentRequestDto> _paymentIntentValidator;
        private readonly IValidator<PaymentConfirmRequestDto> _paymentConfirmValidator;
        private readonly IMapper _mapper;
        private readonly UserManager<ApplicationUser> _userManager;

        public PaymentProcessingService(
            IPaymentRepository paymentRepository,
            ISessionRepository sessionRepository,
            IMentorRepository mentorRepository,
            IEmailService emailService,
            IPaymentFactory paymentFactory,
            IOptions<PaymentSettings> paymentSettings,
            ILogger<PaymentProcessingService> logger,
            IValidator<PaymentIntentRequestDto> paymentIntentValidator,
            IValidator<PaymentConfirmRequestDto> paymentConfirmValidator,
            UserManager<ApplicationUser> userManager,
            IMapper mapper)
        {
            _paymentRepository = paymentRepository;
            _sessionRepository = sessionRepository;
            _mentorRepository = mentorRepository;
            _emailService = emailService;
            _paymentFactory = paymentFactory;
            _logger = logger;
            _paymentIntentValidator = paymentIntentValidator;
            _paymentConfirmValidator = paymentConfirmValidator;
            _userManager = userManager;
            _mapper = mapper;
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
            if (session.MenteeId != userId)
                throw new UnauthorizedException($"Access Denied");

            var mentor = await _mentorRepository.GetMentorWithUserByIdAsync(session.MentorId);
            if (mentor is null)
                throw new NotFoundException("Mentor", session.MentorId);
            var mentee = await _userManager.FindByIdAsync(session.MenteeId);
            if (mentee is null)
                throw new NotFoundException("Mentee", session.MenteeId);



            // Get the appropriate payment service
            var paymentService = _paymentFactory.GetService(request.PaymentMethod);

            // Create payment intent request
            var paymentIntentRequest = new PaymentIntentRequest
            {
                Amount = session.Price,
                Currency = "EGP", // or session.Currency if you have it
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
                PaymentMethod = request.PaymentMethod,
                PaymentIntentId = providerResponse.PaymentIntentId,
                ClientSecret = providerResponse.ClientSecret,
                Amount = session.Price,
                Currency = providerResponse.Currency,
                Status = PaymentStatusOptions.Pending,
                PlatformCommission = 0.15m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _paymentRepository.AddAsync(payment);
            await _paymentRepository.SaveChangesAsync();

            _logger.LogInformation(
                "Payment intent created. PaymentId: {PaymentId}, SessionId: {SessionId}, Provider: {Provider}",
                payment.Id, request.SessionId, paymentService.ProviderName);

            return new PaymentIntentResponseDto
            {
                PaymentIntentId = payment.PaymentIntentId,
                ClientSecret = payment.ClientSecret,
                Amount = payment.Amount,
                Currency = payment.Currency,
                SessionId = payment.SessionId,
                PaymentMethod = payment.PaymentMethod,
                PaymobPaymentMethod = payment.PaymobPaymentMethod,
                Status = payment.Status
            };
        }

        public async Task HandleStripeWebhookAsync(string payload, string signature)
        {
            var stripeService = _paymentFactory.GetService(PaymentMethodOptions.Stripe);
            var callbackResult = stripeService.HandleCallback(payload);

            await ProcessPaymentCallbackAsync(callbackResult, "Stripe");
            await _paymentRepository.SaveChangesAsync();
        }

        public async Task HandlePaymobWebhookAsync(string payload, string signature)
        {
            var paymobService = _paymentFactory.GetService(PaymentMethodOptions.Paymob);
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

            // Verify payment is not already confirmed
            if (payment.Status == PaymentStatusOptions.Captured)
                throw new ConflictException("Payment has already been confirmed");

            // Get session
            var session = await _sessionRepository.GetByIdAsync(payment.SessionId);
            if (session == null)
                throw new NotFoundException("Session", payment.SessionId);

            // Get payment service to verify with provider
            var paymentService = _paymentFactory.GetService(payment.PaymentMethod);


            // Verify payment status with provider (implementation depends on your provider SDK)
            await VerifyPaymentWithProviderAsync(paymentService, payment.PaymentIntentId);

            // Validate payment amount matches session price
            if (payment.Amount != session.Price)
            {
                _logger.LogWarning(
                    "Payment amount mismatch. Payment: {PaymentAmount}, Session: {SessionPrice}",
                    payment.Amount, session.Price);
                throw new BusinessException("Payment amount does not match session price");
            }

            // Calculate commission
            var platformCommission = payment.Amount * payment.PlatformCommission;
            var mentorPayout = payment.Amount * (1 - payment.PlatformCommission);

            // Update payment status
            payment.Status = PaymentStatusOptions.Captured;
            payment.UpdatedAt = DateTime.UtcNow;
            payment.PaymentReleaseDate = DateTime.UtcNow.AddDays(7); // Release after 7 days
            _paymentRepository.Update(payment);
            // Update session status
            session.Status = SessionStatusOptions.Confirmed;
            session.UpdatedAt = DateTime.UtcNow;

            // Generate video conference link
            session.VideoConferenceLink = await GenerateVideoConferenceLinkAsync(session);
            _sessionRepository.Update(session);
            await _paymentRepository.SaveChangesAsync();

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
            var totalCount = await _paymentRepository.GetPaymentHistoryCountAsync(userId, status);
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
            var mentorIds = payments.Select(p => p.Session.MentorId).Distinct();
            Dictionary<string, Mentor> mentors = [];
            foreach (var mentorId in mentorIds)
            {
                mentors[mentorId] = (await _mentorRepository.GetMentorWithUserByIdAsync(mentorId))!;
            }

            foreach (var payment in payments)
                payment.Session.Mentor = mentors[payment.Session.MenteeId];

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
                    payment.PaymentReleaseDate = DateTime.UtcNow.AddDays(7);
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
                var menteeEmailHtmlBody = GenerateMenteeConfirmationEmailBody(session, payment, mentor, mentee);

                await _emailService.SendEmailAsync(
                    mentee.Email!,
                    menteeSubject,
                    menteeEmailHtmlBody.HtmlToString(),
                    menteeEmailHtmlBody); // Assuming the last argument is for plain text body, using HTML for simplicity

                // 2. Send email to mentor
                var mentorSubject = "New Session Booked";
                var mentorEmailHtmlBody = GenerateMentorConfirmationEmailBody(session, payment, mentor, mentee);

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

        /// <summary>
        /// Generates the HTML body for the mentee's session confirmation email.
        /// </summary>
        private string GenerateMenteeConfirmationEmailBody(Session session, Payment payment, Mentor mentor, ApplicationUser mentee)
        {
            // Use 'C' (Currency) format specifier, which includes the currency symbol based on the current culture (or default if no culture is set).
            return $@"
        <h2>Session Confirmed!</h2>
        <p>Dear {mentee.FirstName},</p>
        <p>Your mentorship session has been confirmed.</p>
        
        <h3>Session Details:</h3>
        <ul>
            <li><strong>Topic:</strong> {session.Topic}</li>
            <li><strong>Mentor:</strong> {mentor.User.FullName}</li>
            <li><strong>Date:</strong> {session.ScheduledStartTime:MMMM dd, yyyy}</li>
            <li><strong>Time:</strong> {session.ScheduledStartTime:hh:mm tt}</li>
            <li><strong>Duration:</strong> {session.Duration} minutes</li>
            <li><strong>Meeting Link:</strong> <a href='{session.VideoConferenceLink}'>{session.VideoConferenceLink}</a></li>
        </ul>
        
        <h3>Payment Details:</h3>
        <ul>
            <li><strong>Amount Paid:</strong> {payment.Amount:C} {payment.Currency}</li>
            <li><strong>Transaction ID:</strong> {payment.ProviderTransactionId}</li>
        </ul>
        <p>We look forward to your session!</p>
    ";
        }

        /// <summary>
        /// Generates the HTML body for the mentor's new session booking email.
        /// </summary>
        private string GenerateMentorConfirmationEmailBody(Session session, Payment payment, Mentor mentor, ApplicationUser mentee)
        {
            // Calculate platform fee as a separate variable for clarity, even though it's used inline.
            var platformFee = payment.Amount * 0.15m;

            return $@"
        <h2>New Session Booked!</h2>
        <p>Dear {mentor.User.FullName},</p>
        <p>A new mentorship session has been booked with you.</p>
        
        <h3>Session Details:</h3>
        <ul>
            <li><strong>Topic:</strong> {session.Topic}</li>
            <li><strong>Mentee:</strong> {mentee.FullName}</li>
            <li><strong>Date:</strong> {session.ScheduledStartTime:MMMM dd, yyyy}</li>
            <li><strong>Time:</strong> {session.ScheduledStartTime:hh:mm tt}</li>
            <li><strong>Duration:</strong> {session.Duration} minutes</li>
            <li><strong>Meeting Link:</strong> <a href='{session.VideoConferenceLink}'>{session.VideoConferenceLink}</a></li>
        </ul>
        
        <h3>Earnings:</h3>
        <ul>
            <li><strong>Session Price:</strong> {payment.Amount:C} {payment.Currency}</li>
            <li><strong>Platform Fee (15%):</strong> {platformFee:C} {payment.Currency}</li>
            <li><strong>Your Earnings:</strong> {payment.MentorPayoutAmount:C} {payment.Currency}</li>
            <li><strong>Payout Date:</strong> {payment.PaymentReleaseDate:MMMM dd, yyyy}</li>
        </ul>
        <p>Please be ready for the session at the scheduled time.</p>
    ";
        }


    }
}
