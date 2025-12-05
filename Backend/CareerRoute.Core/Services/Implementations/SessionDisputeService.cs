using AutoMapper;
using CareerRoute.Core.Constants;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs;
using CareerRoute.Core.DTOs.Disputes;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace CareerRoute.Core.Services.Implementations
{
    public class SessionDisputeService : ISessionDisputeService
    {
        private readonly ISessionDisputeRepository _disputeRepository;
        private readonly ISessionRepository _sessionRepository;
        private readonly IPaymentRepository _paymentRepository;
        private readonly IMentorBalanceRepository _balanceRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<SessionDisputeService> _logger;
        private const int DisputeWindowDays = 3;

        public SessionDisputeService(
            ISessionDisputeRepository disputeRepository,
            ISessionRepository sessionRepository,
            IPaymentRepository paymentRepository,
            IMentorBalanceRepository balanceRepository,
            IMapper mapper,
            ILogger<SessionDisputeService> logger)
        {
            _disputeRepository = disputeRepository;
            _sessionRepository = sessionRepository;
            _paymentRepository = paymentRepository;
            _balanceRepository = balanceRepository;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<DisputeDto> CreateDisputeAsync(string sessionId, string menteeId, CreateDisputeDto dto)
        {
            _logger.LogInformation("Creating dispute for session {SessionId} by mentee {MenteeId}", sessionId, menteeId);

            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null)
                throw new NotFoundException($"Session {sessionId} not found");

            if (session.MenteeId != menteeId)
                throw new UnauthorizedException("You can only dispute your own sessions");

            if (session.Status != SessionStatusOptions.Completed)
                throw new BusinessException("Can only dispute completed sessions");

            // Check if within dispute window (3 days after completion)
            if (session.CompletedAt.HasValue && DateTime.UtcNow > session.CompletedAt.Value.AddDays(DisputeWindowDays))
                throw new BusinessException("Dispute window has expired (3 days after session completion)");

            // Check for existing dispute
            var existingDispute = await _disputeRepository.GetBySessionIdAsync(sessionId);
            if (existingDispute != null)
                throw new ConflictException("A dispute already exists for this session");

            var dispute = new SessionDispute
            {
                SessionId = sessionId,
                MenteeId = menteeId,
                Reason = dto.Reason,
                Description = dto.Description,
                Status = DisputeStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _disputeRepository.AddAsync(dispute);
            await _disputeRepository.SaveChangesAsync();

            _logger.LogInformation("Dispute {DisputeId} created for session {SessionId}", dispute.Id, sessionId);

            return _mapper.Map<DisputeDto>(dispute);
        }

        public async Task<DisputeDto?> GetDisputeBySessionIdAsync(string sessionId, string userId, string role)
        {
            var dispute = await _disputeRepository.GetBySessionIdAsync(sessionId);
            if (dispute == null)
                return null;

            // Check authorization
            if (role != AppRoles.Admin && dispute.MenteeId != userId)
            {
                var session = await _sessionRepository.GetByIdAsync(sessionId);
                if (session?.MentorId != userId)
                    throw new UnauthorizedException("Access denied");
            }

            return _mapper.Map<DisputeDto>(dispute);
        }

        public async Task<DisputeDto> GetDisputeByIdAsync(string disputeId)
        {
            var dispute = await _disputeRepository.GetByIdAsync(disputeId);
            if (dispute == null)
                throw new NotFoundException($"Dispute {disputeId} not found");

            return _mapper.Map<DisputeDto>(dispute);
        }

        public async Task<AdminDisputeDto> ResolveDisputeAsync(string disputeId, string adminId, ResolveDisputeDto dto)
        {
            _logger.LogInformation("Admin {AdminId} resolving dispute {DisputeId}", adminId, disputeId);

            var dispute = await _disputeRepository.GetByIdWithDetailsAsync(disputeId);
            if (dispute == null)
                throw new NotFoundException($"Dispute {disputeId} not found");

            if (dispute.Status == DisputeStatus.Resolved || dispute.Status == DisputeStatus.Rejected)
                throw new BusinessException($"Dispute is already {dispute.Status}");

            await using var transaction = await _disputeRepository.BeginTransactionAsync();
            try
            {
                dispute.Resolution = dto.Resolution;
                dispute.RefundAmount = dto.RefundAmount;
                dispute.AdminNotes = dto.AdminNotes;
                dispute.ResolvedById = adminId;
                dispute.ResolvedAt = DateTime.UtcNow;
                dispute.Status = dto.Resolution == DisputeResolution.NoRefund 
                    ? DisputeStatus.Rejected 
                    : DisputeStatus.Resolved;

                // Handle refund if applicable
                if (dto.Resolution != DisputeResolution.NoRefund && dto.RefundAmount > 0)
                {
                    await ProcessRefundAsync(dispute, dto.RefundAmount.Value);
                }

                _disputeRepository.Update(dispute);
                await _disputeRepository.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Dispute {DisputeId} resolved with {Resolution}", disputeId, dto.Resolution);

                return MapToAdminDto(dispute);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error resolving dispute {DisputeId}", disputeId);
                throw;
            }
        }

        private async Task ProcessRefundAsync(SessionDispute dispute, decimal refundAmount)
        {
            var session = dispute.Session;
            var payment = await _paymentRepository.GetByIdAsync(session.PaymentId!);
            
            if (payment == null)
            {
                _logger.LogWarning("No payment found for session {SessionId}", session.Id);
                return;
            }

            // If payment was already released to mentor, deduct from their balance
            if (payment.IsReleasedToMentor)
            {
                var balance = await _balanceRepository.GetByMentorIdAsync(session.MentorId);
                if (balance != null && balance.AvailableBalance >= refundAmount)
                {
                    balance.AvailableBalance -= refundAmount;
                    balance.UpdatedAt = DateTime.UtcNow;
                    _balanceRepository.Update(balance);
                }
            }
            else
            {
                // Payment still in pending, deduct from pending balance
                var balance = await _balanceRepository.GetByMentorIdAsync(session.MentorId);
                if (balance != null)
                {
                    var mentorAmount = session.Price * (1 - payment.PlatformCommission);
                    if (balance.PendingBalance >= mentorAmount)
                    {
                        balance.PendingBalance -= mentorAmount;
                        balance.TotalEarnings -= mentorAmount;
                        balance.UpdatedAt = DateTime.UtcNow;
                        _balanceRepository.Update(balance);
                    }
                }
            }

            // Mark payment as refunded
            payment.IsRefunded = true;
            payment.RefundAmount = refundAmount;
            payment.RefundedAt = DateTime.UtcNow;
            _paymentRepository.Update(payment);

            _logger.LogInformation("Processed refund of {Amount} for session {SessionId}", refundAmount, session.Id);
        }

        public async Task<AdminDisputeListResponseDto> GetAllDisputesForAdminAsync(AdminDisputeFilterDto filter)
        {
            var (disputes, totalCount) = await _disputeRepository.GetFilteredDisputesAsync(filter);
            var disputeDtos = disputes.Select(MapToAdminDto).ToList();

            var totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize);

            return new AdminDisputeListResponseDto
            {
                Disputes = disputeDtos,
                Pagination = new PaginationMetadataDto
                {
                    TotalCount = totalCount,
                    CurrentPage = filter.Page,
                    PageSize = filter.PageSize,
                    TotalPages = totalPages,
                    HasNextPage = filter.Page < totalPages,
                    HasPreviousPage = filter.Page > 1
                }
            };
        }

        public async Task<bool> HasActiveDisputeAsync(string sessionId)
        {
            return await _disputeRepository.HasActiveDisputeAsync(sessionId);
        }

        private AdminDisputeDto MapToAdminDto(SessionDispute dispute)
        {
            return new AdminDisputeDto
            {
                Id = dispute.Id,
                SessionId = dispute.SessionId,
                MenteeId = dispute.MenteeId,
                MenteeFirstName = dispute.Mentee?.FirstName ?? "",
                MenteeLastName = dispute.Mentee?.LastName ?? "",
                MenteeEmail = dispute.Mentee?.Email ?? "",
                MentorId = dispute.Session?.MentorId ?? "",
                MentorFirstName = dispute.Session?.Mentor?.User?.FirstName ?? "",
                MentorLastName = dispute.Session?.Mentor?.User?.LastName ?? "",
                SessionPrice = dispute.Session?.Price ?? 0,
                Reason = dispute.Reason,
                Description = dispute.Description,
                Status = dispute.Status,
                Resolution = dispute.Resolution,
                RefundAmount = dispute.RefundAmount,
                AdminNotes = dispute.AdminNotes,
                CreatedAt = dispute.CreatedAt,
                ResolvedAt = dispute.ResolvedAt
            };
        }
    }
}
