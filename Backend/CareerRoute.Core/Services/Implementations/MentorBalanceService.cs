using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.Payouts;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace CareerRoute.Core.Services.Implementations
{
    /// <summary>
    /// Service implementation for managing mentor balance operations
    /// </summary>
    public class MentorBalanceService : IMentorBalanceService
    {
        private readonly IMentorBalanceRepository _mentorBalanceRepository;
        private readonly ISessionRepository _sessionRepository;
        private readonly IPaymentRepository _paymentRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<MentorBalanceService> _logger;
        private readonly IJobScheduler _jobScheduler;
        private const int HoldingPeriodDays = 3;

        public MentorBalanceService(
            IMentorBalanceRepository mentorBalanceRepository,
            ISessionRepository sessionRepository,
            IPaymentRepository paymentRepository,
            IMapper mapper,
            ILogger<MentorBalanceService> logger,
            IJobScheduler jobScheduler)
        {
            _mentorBalanceRepository = mentorBalanceRepository;
            _sessionRepository = sessionRepository;
            _paymentRepository = paymentRepository;
            _mapper = mapper;
            _logger = logger;
            _jobScheduler = jobScheduler;
        }

        public async Task<MentorBalanceDto> GetMentorBalanceAsync(string mentorId)
        {
            _logger.LogInformation("Retrieving balance for mentor {MentorId}", mentorId);

            var balance = await _mentorBalanceRepository.GetByMentorIdAsync(mentorId);

            if (balance == null)
            {
                _logger.LogWarning("Balance not found for mentor {MentorId}", mentorId);
                throw new NotFoundException($"Balance not found for mentor {mentorId}");
            }

            return _mapper.Map<MentorBalanceDto>(balance);
        }

        public async Task InitializeMentorBalanceAsync(string mentorId)
        {
            _logger.LogInformation("Initializing balance for mentor {MentorId}", mentorId);

            var existingBalance = await _mentorBalanceRepository.GetByMentorIdAsync(mentorId);
            if (existingBalance != null)
            {
                _logger.LogInformation("Balance already exists for mentor {MentorId}", mentorId);
                return;
            }

            var newBalance = new MentorBalance
            {
                MentorId = mentorId,
                AvailableBalance = 0,
                PendingBalance = 0,
                TotalEarnings = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _mentorBalanceRepository.AddAsync(newBalance);
            await _mentorBalanceRepository.SaveChangesAsync();
            _logger.LogInformation("Initialized balance for mentor {MentorId}", mentorId);
        }

        public async Task UpdateBalanceOnSessionCompletionAsync(string sessionId)
        {
            _logger.LogInformation("Updating balance for completed session {SessionId}", sessionId);

            // Get session with payment
            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session is null)
            {
                _logger.LogError("Session {SessionId} not found", sessionId);
                throw new NotFoundException($"Session {sessionId} not found");
            }

            // Get payment for the session
            var payment = session.PaymentId is null
                ? null
                : await _paymentRepository.GetByIdAsync(session.PaymentId);
            if (payment is null)
            {
                _logger.LogError("No payment found for session {SessionId}, skipping balance update", sessionId);
                throw new NotFoundException($"Paymet for session {sessionId} not found");
            }

            // Calculate mentor payout amount
            var mentorPayoutAmount = session.Price * (1 - payment.PlatformCommission);

            // Get or create mentor balance
            var balance = await _mentorBalanceRepository.GetByMentorIdAsync(session.MentorId);
            
            await using var transaction = await _mentorBalanceRepository.BeginTransactionAsync();
            try
            {
                if (balance == null)
                {
                    _logger.LogInformation("Creating new balance for mentor {MentorId}", session.MentorId);
                    await InitializeMentorBalanceAsync(session.MentorId);
                    balance = await _mentorBalanceRepository.GetByMentorIdAsync(session.MentorId);
                }

                // Update balance
                balance!.PendingBalance += mentorPayoutAmount;
                balance.TotalEarnings += mentorPayoutAmount;
                balance.UpdatedAt = DateTime.UtcNow;

                // Set payment release date for reference
                var releaseDate = DateTime.UtcNow.AddDays(HoldingPeriodDays);
                payment.PaymentReleaseDate = releaseDate;

                _mentorBalanceRepository.Update(balance);
                _paymentRepository.Update(payment);
                await _mentorBalanceRepository.SaveChangesAsync();

                // Schedule the release job
                _jobScheduler.Schedule<IReleasePaymentJob>(
                    job => job.ExecuteAsync(sessionId),
                    TimeSpan.FromDays(HoldingPeriodDays));

                await transaction.CommitAsync();

                _logger.LogInformation(
                    "Updated balance for mentor {MentorId}: Added {Amount} to pending balance. Scheduled release job for {ReleaseDate}",
                    session.MentorId, mentorPayoutAmount, releaseDate);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update balance for session {SessionId}", sessionId);
                await transaction.RollbackAsync();
                throw;
            }
        }

    }
}
