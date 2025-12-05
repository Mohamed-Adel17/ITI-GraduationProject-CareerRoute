using AutoMapper;
using CareerRoute.Core.Constants;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs;
using CareerRoute.Core.DTOs.Payouts;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Extentions;
using CareerRoute.Core.Services.Interfaces;
using FluentValidation;
using Microsoft.Extensions.Logging;

namespace CareerRoute.Core.Services.Implementations
{
    public class PayoutService : IPayoutService
    {
        private readonly IPayoutRepository _payoutRepository;
        private readonly IMentorBalanceRepository _mentorBalanceRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<PayoutRequestDto> _payoutRequestValidator;
        private readonly ILogger<PayoutService> _logger;

        public PayoutService(
            IPayoutRepository payoutRepository,
            IMentorBalanceRepository mentorBalanceRepository,
            IMapper mapper,
            ILogger<PayoutService> logger,
            IValidator<PayoutRequestDto> payoutRequestValidator)
        {
            _payoutRepository = payoutRepository;
            _mentorBalanceRepository = mentorBalanceRepository;
            _mapper = mapper;
            _logger = logger;
            _payoutRequestValidator = payoutRequestValidator;
        }

        public async Task<PayoutDto> RequestPayoutAsync(string mentorId, PayoutRequestDto request)
        {
            await _payoutRequestValidator.ValidateAndThrowCustomAsync(request);
            _logger.LogInformation("Processing payout request for mentor {MentorId}, amount {Amount}",
                mentorId, request.Amount);

            var balance = await _mentorBalanceRepository.GetByMentorIdAsync(mentorId);
            if (balance == null)
            {
                _logger.LogError("Balance not found for mentor {MentorId}", mentorId);
                throw new NotFoundException($"Mentor balance not found for mentor {mentorId}");
            }

            if (request.Amount > balance.AvailableBalance)
            {
                _logger.LogWarning(
                    "Insufficient balance for mentor {MentorId}. Requested: {Requested}, Available: {Available}",
                    mentorId, request.Amount, balance.AvailableBalance);
                throw new BusinessException($"Insufficient balance. Requested: {request.Amount:C}, Available: {balance.AvailableBalance:C}");
            }

            await using var transaction = await _payoutRepository.BeginTransactionAsync();
            try
            {
                var payout = new Payout
                {
                    Id = Guid.NewGuid().ToString(),
                    MentorId = mentorId,
                    Amount = request.Amount,
                    Status = PayoutStatus.Pending,
                    RequestedAt = DateTime.UtcNow
                };

                await _payoutRepository.AddAsync(payout);

                balance.AvailableBalance -= request.Amount;
                balance.UpdatedAt = DateTime.UtcNow;
                _mentorBalanceRepository.Update(balance);

                await _payoutRepository.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation(
                    "Payout request created successfully for mentor {MentorId}. Payout ID: {PayoutId}, Amount: {Amount}",
                    mentorId, payout.Id, request.Amount);

                return _mapper.Map<PayoutDto>(payout);
            }
            catch (Exception ex) 
            {
                _logger.LogError(ex, "Error creating payout request for mentor {MentorId}", mentorId);
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<PayoutHistoryResponseDto> GetPayoutHistoryAsync(string mentorId, int page, int pageSize)
        {
            _logger.LogInformation("Retrieving payout history for mentor {MentorId}, page {Page}, pageSize {PageSize}",
                mentorId, page, pageSize);

            var (payouts, totalCount) = await _payoutRepository.GetPayoutHistoryWithCountAsync(mentorId, page, pageSize);
            var payoutDtos = _mapper.Map<List<PayoutDto>>(payouts);

            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            _logger.LogInformation("Retrieved {Count} payout records for mentor {MentorId}", payoutDtos.Count, mentorId);

            return new PayoutHistoryResponseDto
            {
                Payouts = payoutDtos,
                Pagination = new PaginationMetadataDto
                {
                    TotalCount = totalCount,
                    CurrentPage = page,
                    PageSize = pageSize,
                    TotalPages = totalPages,
                    HasNextPage = page < totalPages,
                    HasPreviousPage = page > 1
                }
            };
        }


        public async Task<PayoutDto> ProcessPayoutAsync(string payoutId)
        {
            _logger.LogInformation("Processing payout {PayoutId}", payoutId);

            var payout = await _payoutRepository.GetByIdAsync(payoutId);
            if (payout == null)
            {
                _logger.LogWarning("Payout {PayoutId} not found", payoutId);
                throw new NotFoundException($"Payout {payoutId} not found");
            }

            if (payout.Status != PayoutStatus.Pending)
            {
                _logger.LogWarning("Cannot process payout {PayoutId} with status {Status}", payoutId, payout.Status);
                throw new BusinessException($"Cannot perform operation on payout {payoutId}. Current status: {payout.Status}, Required status: {PayoutStatus.Pending}");
            }

            await using var transaction = await _payoutRepository.BeginTransactionAsync();
            try
            {
                payout.Status = PayoutStatus.Processing;
                payout.ProcessedAt = DateTime.UtcNow;
                _payoutRepository.Update(payout);
                await _payoutRepository.SaveChangesAsync();

                _logger.LogInformation("Payout {PayoutId} status updated to Processing", payoutId);
                
                // TODO: Replace with actual payment gateway integration (Stripe/Paymob payout API)
                // Current implementation is a placeholder for demo purposes
                await Task.Delay(TimeSpan.FromSeconds(1)); // Simulated processing time

                // TODO: Implement actual payout processing logic
                var isSuccess = true; // Default to success until real integration
                
                if (isSuccess)
                {
                    payout.Status = PayoutStatus.Completed;
                    payout.CompletedAt = DateTime.UtcNow;
                    _payoutRepository.Update(payout);
                    await _payoutRepository.SaveChangesAsync();
                    await transaction.CommitAsync();

                    _logger.LogInformation("Payout {PayoutId} completed successfully", payoutId);
                }
                else
                {
                    payout.Status = PayoutStatus.Failed;
                    payout.FailureReason = "Simulated payment processing failure";

                    var balance = await _mentorBalanceRepository.GetByMentorIdAsync(payout.MentorId);
                    if (balance != null)
                    {
                        balance.AvailableBalance += payout.Amount;
                        balance.UpdatedAt = DateTime.UtcNow;
                        _mentorBalanceRepository.Update(balance);
                    }

                    _payoutRepository.Update(payout);
                    await _payoutRepository.SaveChangesAsync();
                    await transaction.CommitAsync();

                    _logger.LogWarning("Payout {PayoutId} failed: {Reason}", payoutId, payout.FailureReason);
                }

                return _mapper.Map<PayoutDto>(payout);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payout {PayoutId}", payoutId);
                await transaction.RollbackAsync();
                throw;
            }
        }


        public async Task<PayoutDto> CancelPayoutAsync(string payoutId)
        {
            _logger.LogInformation("Cancelling payout {PayoutId}", payoutId);

            var payout = await _payoutRepository.GetByIdAsync(payoutId);
            if (payout == null)
            {
                _logger.LogWarning("Payout {PayoutId} not found", payoutId);
                throw new NotFoundException($"Payout {payoutId} not found");
            }

            if (payout.Status != PayoutStatus.Pending)
            {
                _logger.LogWarning("Cannot cancel payout {PayoutId} with status {Status}", payoutId, payout.Status);
                throw new BusinessException($"Cannot perform operation on payout {payoutId}. Current status: {payout.Status}, Required status: {PayoutStatus.Pending}");
            }

            await using var transaction = await _payoutRepository.BeginTransactionAsync();
            try
            {
                payout.Status = PayoutStatus.Cancelled;
                payout.CancelledAt = DateTime.UtcNow;

                var balance = await _mentorBalanceRepository.GetByMentorIdAsync(payout.MentorId);
                if (balance == null)
                {
                    _logger.LogError("Balance not found for mentor {MentorId}", payout.MentorId);
                    throw new NotFoundException($"Mentor balance not found for mentor {payout.MentorId}");
                }

                balance.AvailableBalance += payout.Amount;
                balance.UpdatedAt = DateTime.UtcNow;

                _mentorBalanceRepository.Update(balance);
                _payoutRepository.Update(payout);
                await _payoutRepository.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Payout {PayoutId} cancelled successfully, amount {Amount} restored to balance",
                    payoutId, payout.Amount);

                return _mapper.Map<PayoutDto>(payout);
            }
            catch (Exception ex) 
            {
                _logger.LogError(ex, "Error cancelling payout {PayoutId}", payoutId);
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<PayoutDto> GetPayoutDetailsAsync(string payoutId, string mentorId, string role)
        {
            _logger.LogInformation("Retrieving payout details for payout {PayoutId}, mentor {MentorId}",
                payoutId, mentorId);

            var payout = await _payoutRepository.GetByIdAsync(payoutId);
            if (payout == null)
            {
                _logger.LogWarning("Payout {PayoutId} not found", payoutId);
                throw new NotFoundException($"Payout {payoutId} not found");
            }

            if (payout.MentorId != mentorId && role != AppRoles.Admin)
            {
                _logger.LogWarning("Payout {PayoutId} does not belong to mentor {MentorId}", payoutId, mentorId);
                throw new UnauthorizedException("Access denied to this payout");
            }

            _logger.LogInformation("Retrieved payout details for payout {PayoutId}", payoutId);
            return _mapper.Map<PayoutDto>(payout);
        }

        public async Task<AdminPayoutListResponseDto> GetAllPayoutsForAdminAsync(AdminPayoutFilterDto filter)
        {
            _logger.LogInformation("Admin retrieving filtered payouts. Status: {Status}, MentorName: {MentorName}",
                filter.Status, filter.MentorName);

            var (payouts, totalCount) = await _payoutRepository.GetFilteredPayoutsAsync(filter);
            var payoutDtos = _mapper.Map<List<AdminPayoutDto>>(payouts);

            var totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize);

            _logger.LogInformation("Retrieved {Count} payout records for admin", payoutDtos.Count);

            return new AdminPayoutListResponseDto
            {
                Payouts = payoutDtos,
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
    }
}
