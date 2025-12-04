using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace CareerRoute.Infrastructure.BackgroundJobs
{
    public class ReleasePaymentBackgroundJob : IReleasePaymentJob
    {
        private readonly ISessionRepository _sessionRepository;
        private readonly IPaymentRepository _paymentRepository;
        private readonly IMentorBalanceRepository _mentorBalanceRepository;
        private readonly ILogger<ReleasePaymentBackgroundJob> _logger;

        public ReleasePaymentBackgroundJob(
            ISessionRepository sessionRepository,
            IPaymentRepository paymentRepository,
            IMentorBalanceRepository mentorBalanceRepository,
            ILogger<ReleasePaymentBackgroundJob> logger)
        {
            _sessionRepository = sessionRepository;
            _paymentRepository = paymentRepository;
            _mentorBalanceRepository = mentorBalanceRepository;
            _logger = logger;
        }

        public async Task ExecuteAsync(string sessionId)
        {
            _logger.LogInformation("Executing payment release for session {SessionId}", sessionId);

            await using var transaction = await _mentorBalanceRepository.BeginTransactionAsync();
            try
            {
                var session = await _sessionRepository.GetByIdAsync(sessionId);
                if (session == null)
                {
                    _logger.LogError("Session {SessionId} not found during payment release", sessionId);
                    return;
                }

                if (string.IsNullOrEmpty(session.PaymentId))
                {
                    _logger.LogError("Session {SessionId} has no payment ID", sessionId);
                    return;
                }

                var payment = await _paymentRepository.GetByIdAsync(session.PaymentId);
                if (payment == null)
                {
                    _logger.LogError("Payment {PaymentId} not found for session {SessionId}", session.PaymentId, sessionId);
                    return;
                }

                if (payment.IsReleasedToMentor)
                {
                    _logger.LogInformation("Payment {PaymentId} already released to mentor", payment.Id);
                    return;
                }

                var balance = await _mentorBalanceRepository.GetByMentorIdAsync(session.MentorId);
                if (balance == null)
                {
                    _logger.LogError("Balance not found for mentor {MentorId}", session.MentorId);
                    return;
                }

                var transferAmount = session.Price * (1 - payment.PlatformCommission);

                // Transfer from pending to available
                balance.PendingBalance -= transferAmount;
                balance.AvailableBalance += transferAmount;
                balance.UpdatedAt = DateTime.UtcNow;

                // Mark payment as released
                payment.IsReleasedToMentor = true;
                payment.ReleasedAt = DateTime.UtcNow;

                _mentorBalanceRepository.Update(balance);
                _paymentRepository.Update(payment);
                await _mentorBalanceRepository.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation(
                    "Successfully released {Amount} to available balance for mentor {MentorId} (Session: {SessionId})",
                    transferAmount, session.MentorId, sessionId);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error executing payment release for session {SessionId}", sessionId);
                throw; // Rethrow to let Hangfire retry
            }
        }
    }
}
