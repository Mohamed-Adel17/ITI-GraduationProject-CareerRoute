using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs;
using CareerRoute.Core.DTOs.Reviews;
using CareerRoute.Core.DTOs.Sessions;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Extentions;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Validators.Sessions;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Implementations
{
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _reviewsRepository;
        private readonly ISessionRepository _sessionRepository;
        private readonly IMentorRepository _mentorRepository;
        private readonly IValidator<CreateReviewRequestDto> _createReviewRequestDto;
        private readonly IMapper _mapper;
        private readonly ILogger<ReviewService> _logger;


        public ReviewService(
            IReviewRepository reviewsRepository,
            ISessionRepository sessionRepository,
            IMentorRepository mentorRepository,
            IValidator<CreateReviewRequestDto> createReviewRequestDto,
            IMapper mapper,
            ILogger<ReviewService> logger
)
        {
            _mentorRepository = mentorRepository;
            _reviewsRepository = reviewsRepository;
            _sessionRepository = sessionRepository;
            _createReviewRequestDto = createReviewRequestDto;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<CreateReviewResponseDto> AddReviewAsync(string sessionId, string menteeId, CreateReviewRequestDto dto)
        {
            _logger.LogInformation("[Review] Mentee {MenteeId} attempting to add review for session {SessionId}", menteeId, sessionId);

            await _createReviewRequestDto.ValidateAndThrowCustomAsync(dto);

            await using var transaction = await _reviewsRepository.BeginTransactionAsync();
            try
            {
                var session = await _sessionRepository.GetByIdWithRelationsAsync(sessionId);
                if (session == null)
                {
                    _logger.LogWarning("[Review] Session {SessionId} not found", sessionId);
                    throw new NotFoundException("Session not found.");
                }

                if (session.MenteeId != menteeId)
                {
                    _logger.LogWarning("[Review] Mentee {MenteeId} is not allowed to review session {SessionId}", menteeId, sessionId);
                    throw new UnauthorizedException("You can only review sessions you participated in.");
                }

                if (session.Review != null)
                {
                    _logger.LogWarning("[Review] Session {SessionId} already has a review", sessionId);
                    throw new ConflictException("This session has already been reviewed.");
                }


                if (session.CompletedAt == null || session.Status != SessionStatusOptions.Completed)
                {
                    _logger.LogWarning("[Review] Session {SessionId} is not completed yet", sessionId);
                    throw new BusinessException("Cannot review before session is completed.");
                }


                var review = _mapper.Map<ReviewSession>(dto);
                review.Id = Guid.NewGuid().ToString();
                review.SessionId = sessionId;
                await _reviewsRepository.AddAsync(review);
                await _reviewsRepository.SaveChangesAsync();

                var mentor = await _mentorRepository.GetByIdAsync(session.MentorId);
                mentor.AverageRating = await _reviewsRepository.GetMentorAverageRatingAsync(session.MentorId);
                mentor.TotalReviews++;
                _mentorRepository.Update(mentor);
                await _mentorRepository.SaveChangesAsync();

                await transaction.CommitAsync();
                _logger.LogInformation("[Review] Review {ReviewId} added successfully for session {SessionId} by mentee {MenteeId}", review.Id, sessionId, menteeId);

                var reviewWithRelation = await _reviewsRepository.GetByIdWithRelationsAsync(review.Id);
                return _mapper.Map<CreateReviewResponseDto>(reviewWithRelation);
            }
            catch
            {
                _logger.LogError("[Review] Failed to add review for session {SessionId} by mentee {MenteeId}", sessionId, menteeId);
                await transaction.RollbackAsync();
                throw;
            }
        }



        public async Task<MentorReviewsDto> GetReviewsForMentorAsync(string mentorId, int page, int pageSize)
        {
            _logger.LogInformation("[Review] Fetching reviews for mentor {MentorId} with page {Page} and pageSize {PageSize}", mentorId, page, pageSize);

            var (reviews, totalCount) = await _reviewsRepository.GetReviewsForMentorAsync(mentorId, page, pageSize);

            // If no reviews, just create an empty list
            var reviewDtos = reviews != null && reviews.Count > 0
                ? _mapper.Map<List<ReviewDetailsItemDto>>(reviews)
                : new List<ReviewDetailsItemDto>();

            var pagination = new PaginationMetadataDto
            {
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                HasNextPage = page * pageSize < totalCount,
                HasPreviousPage = page > 1
            };

            _logger.LogInformation("[Review] Retrieved {Count} reviews for mentor {MentorId}", reviewDtos.Count, mentorId);

            return new MentorReviewsDto
            {
                Reviews = reviewDtos,
                Pagination = pagination
            };
        }


    }
}



