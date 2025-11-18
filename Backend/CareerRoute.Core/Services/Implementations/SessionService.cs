using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.Sessions;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Extentions;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Validators.Sessions;
using FluentValidation;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Implementations
{
    public class SessionService : ISessionService
    {
        private readonly ILogger<SessionService> _logger;
        private readonly IMapper _mapper;
        private readonly ISessionRepository _sessionRepository;
        private readonly IMentorRepository _mentorRepository;
        private readonly ITimeSlotRepository _timeSlotRepository;
        private readonly IValidator<BookSessionRequestDto> _bookSessionRequestValidator;

        public SessionService(
            ILogger<SessionService> logger,
            IMapper mapper,
            ISessionRepository sessionRepository,
            IMentorRepository mentorRepository,
            ITimeSlotRepository timeSlotRepository,
            IValidator<BookSessionRequestDto> bookSessionRequestValidator)
        {
            _logger = logger;
            _mapper = mapper;
            _sessionRepository = sessionRepository;
            _mentorRepository = mentorRepository;
            _timeSlotRepository = timeSlotRepository;
            _bookSessionRequestValidator = bookSessionRequestValidator;
        }

        public async Task<BookSessionResponseDto> BookSessionByIdAsync(string menteeId, BookSessionRequestDto dto)
        {

            await _bookSessionRequestValidator.ValidateAndThrowCustomAsync(dto);



            var timeSlot = await _timeSlotRepository.GetByIdAsync(dto.TimeSlotId);
            if (timeSlot == null)
                throw new NotFoundException("TimeSlot not found.");

            if (timeSlot.IsBooked)
                throw new ConflictException("TimeSlot is already booked.");

            if (timeSlot.StartDateTime < DateTime.UtcNow.AddHours(24))
                throw new ConflictException("TimeSlot must be booked at least 24 hours in advance.");



            var mentor = await _mentorRepository.GetByIdAsync(timeSlot.MentorId);
            if (mentor == null)
                throw new NotFoundException("Mentor not found.");



            bool hasOverlap = await _sessionRepository.HasOverlappingSession(
                menteeId,
                timeSlot.StartDateTime,
                timeSlot.StartDateTime.AddMinutes(timeSlot.DurationMinutes));

            if (hasOverlap)
                throw new ConflictException("You already have another session at this time.");


            var session = _mapper.Map<Session>(dto);

            session.MentorId = timeSlot.MentorId;
            session.MenteeId = menteeId;
            session.ScheduledStartTime = timeSlot.StartDateTime;
            session.ScheduledEndTime = timeSlot.StartDateTime.AddMinutes(timeSlot.DurationMinutes);
            session.Price = timeSlot.DurationMinutes == 30 ? mentor.Rate30Min :
                timeSlot.DurationMinutes == 60 ? mentor.Rate60Min :
                throw new ConflictException("Unsupported session duration for pricing.");

            session.Status = SessionStatusOptions.Pending;
            session.SessionType = SessionTypeOptions.OneOnOne;
            session.Duration = (DurationOptions)timeSlot.DurationMinutes;
            session.CreatedAt = DateTime.UtcNow;

            await _sessionRepository.AddAsync(session);
            await _sessionRepository.SaveChangesAsync();

            timeSlot.IsBooked = true;
            timeSlot.SessionId = session.Id;

            _timeSlotRepository.Update(timeSlot);
            await _timeSlotRepository.SaveChangesAsync();

            return _mapper.Map<BookSessionResponseDto>(session);
        }



        public async Task<SessionDetailsResponseDto> GetSessionDetailsAsync(string sessionId)
        {
            var session = await _sessionRepository.GetByIdWithRelationsAsync(sessionId);
            if (session == null)
                throw new NotFoundException("Session", sessionId);

            var dto = _mapper.Map<SessionDetailsResponseDto>(session);
            return dto;
        }
    }
}
