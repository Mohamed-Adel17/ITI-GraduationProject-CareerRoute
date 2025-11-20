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
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Diagnostics.Metrics;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using static Microsoft.AspNetCore.Internal.AwaitableThreadPool;
using static System.Net.WebRequestMethods;

namespace CareerRoute.Core.Services.Implementations
{
    public class SessionService : ISessionService
    {
        private readonly ILogger<SessionService> _logger;
        private readonly IMapper _mapper;
        private readonly ISessionRepository _sessionRepository;
        private readonly IMentorRepository _mentorRepository;
        private readonly ITimeSlotRepository _timeSlotRepository;
        private readonly IRescheduleSessionRepository _rescheduleSessionRepository;
        private readonly IEmailService _emailService;
        private readonly IValidator<BookSessionRequestDto> _bookSessionRequestValidator;
        private readonly IValidator<RescheduleSessionRequestDto> _rescheduleSessionValidator;

        public SessionService(
            ILogger<SessionService> logger,
            IMapper mapper,
            ISessionRepository sessionRepository,
            IMentorRepository mentorRepository,
            ITimeSlotRepository timeSlotRepository,
            IEmailService emailService,
            IRescheduleSessionRepository rescheduleSessionRepository,
            IValidator<BookSessionRequestDto> bookSessionRequestValidator,
            IValidator<RescheduleSessionRequestDto> rescheduleSessionValidator)

        {
            _logger = logger;
            _mapper = mapper;
            _sessionRepository = sessionRepository;
            _mentorRepository = mentorRepository;
            _timeSlotRepository = timeSlotRepository;
            _emailService = emailService;
            _rescheduleSessionRepository = rescheduleSessionRepository;
            _bookSessionRequestValidator = bookSessionRequestValidator;
            _rescheduleSessionValidator = rescheduleSessionValidator;
        }

        public async Task<BookSessionResponseDto> BookSessionAsync(string menteeId, BookSessionRequestDto dto)
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


        public async Task<List<UpCommingSessionsResponseDto>> GetUpcomingSessionsAsync()
        {

            var allUpcomingSessions = await _sessionRepository.GetUpcomingSessionsAsync();

            //Empty List 
            if (allUpcomingSessions.Count == 0)
                throw new NotFoundException("No Upcomming Sessions ");


            var response = _mapper.Map<List<UpCommingSessionsResponseDto>>(allUpcomingSessions);

            return response;
        }


        public async Task<List<PastSessionsResponseDto>> GetPastSessionsAsync()
        {
            var allPastSessions = await _sessionRepository.GetPastSessionsAsync();

            if (allPastSessions.Count == 0)

                throw new NotFoundException("No Past Sessions ");
            var response = _mapper.Map<List<PastSessionsResponseDto>>(allPastSessions);

            return response;
        }


        public async Task<RescheduleSessionResponseDto> RescheduleSessionAsync(string sessionId, RescheduleSessionRequestDto dto,
                                                                                string userId, string role)
        {
            await _rescheduleSessionValidator.ValidateAndThrowCustomAsync(dto);

            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null)
                throw new NotFoundException("TimeSlot not found.");

          
            bool isMentorRequester = session.Mentor.User.Id == userId;
            bool isMenteeRequester = session.Mentee.Id == userId;
            if (!isMentorRequester && !isMenteeRequester)
                throw new BusinessException("You are not a participant of this session.");


            bool mentorTimeSlotAvailable = await _timeSlotRepository.IsAvailableTimeSlotAsync(session.MentorId,
                                            dto.NewScheduledStartTime,
                                            (int)(session.Duration));

            if (!mentorTimeSlotAvailable)
                throw new ConflictException("Mentor has no available time at the requested slot.");

            bool mentorSessionAvailable = await _sessionRepository.IsMentorSessionAvailableAsync(session.MentorId,
                                            dto.NewScheduledStartTime,
                                            (int)(session.Duration));
            if (!mentorSessionAvailable)
                throw new ConflictException("Mentor has another session at this time.");

            bool menteeAvailable = await _sessionRepository.IsMenteeAvailableAsync(session.MentorId,
                                            dto.NewScheduledStartTime,
                                            (int)(session.Duration));

            if (!menteeAvailable)
                throw new ConflictException("Mentee has another session at this time.");


            var rescheduleRequest = _mapper.Map<RescheduleSession>(dto);
            rescheduleRequest.SessionId = session.Id;
            rescheduleRequest.OriginalStartTime = session.ScheduledStartTime;
            rescheduleRequest.RequestedBy = role;
            rescheduleRequest.Status = SessionRescheduleOptions.Pending;


            await _rescheduleSessionRepository.AddAsync(rescheduleRequest);
            await _rescheduleSessionRepository.SaveChangesAsync();


            string receiverEmail;
            string receiverName;
            string requesterName;

            if (isMentorRequester)
            {
                receiverEmail = session.Mentee.Email;
                receiverName = session.Mentee.FirstName;
                requesterName = session.Mentor.User.FirstName;
            }
            else
            {
                receiverEmail = session.Mentor.User.Email;
                receiverName = session.Mentor.User.FirstName;
                requesterName = session.Mentee.FirstName;
            }

            await SendRescheduleRequestEmailAsync(receiverEmail , receiverName, requesterName, session, rescheduleRequest); 

            return _mapper.Map<RescheduleSessionResponseDto>(rescheduleRequest);

            //confirmation ?
            //rejection ?
            //session entity updates 
            //time slot updates if old in session was already a time slot 
        }
        private async Task SendRescheduleRequestEmailAsync(string receiverEmail,string receiverName,
                     string requesterName,Session session, RescheduleSession rescheduleRequest)
        {
            var approveLink = $"https://localhost:7062/sessions/{session.Id}/reschedule/approve?requestId={rescheduleRequest.Id}";
            var rejectLink = $"https://localhost:7062/sessions/{session.Id}/reschedule/reject?requestId={rescheduleRequest.Id}";

            string htmlContent = $@"
            <h2>Session Reschedule Request</h2>

            <p>Dear {receiverName},</p>

            <p>The session with <b>{requesterName}</b> is requested to be rescheduled.</p>

            <p><b>Original time:</b> {rescheduleRequest.OriginalStartTime:yyyy-MM-dd HH:mm}</p>
            <p><b>Requested new time:</b> {rescheduleRequest.NewScheduledStartTime:yyyy-MM-dd HH:mm}</p>

            <p>Please approve or reject the rescheduling request with 48 hours : </p>

            <a href='{approveLink}' style='padding:10px 15px;background:#4CAF50;color:white;text-decoration:none;border-radius:6px;'>Approve</a>
            <a href='{rejectLink}' style='padding:10px 15px;background:#E53935;color:white;text-decoration:none;border-radius:6px;margin-left:10px;'>Reject</a>

            <br /><br />
            <p>Thank you.</p>
            ";

        await _emailService.SendEmailAsync(
                receiverEmail,
                "Session Reschedule Request",
                "A session reschedule request has been submitted.",
                htmlContent
        );
        }


    }


}

