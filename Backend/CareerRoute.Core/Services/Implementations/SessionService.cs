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
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Diagnostics;
using System.Diagnostics.Metrics;
using System.Drawing;
using System.Linq;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Channels;
using System.Threading.Tasks;
using static Microsoft.AspNetCore.Internal.AwaitableThreadPool;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;
using static System.Net.WebRequestMethods;
using Hangfire;


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
        private readonly ICancelSessionRepository _cancelSessionRepository;
        private readonly IEmailService _emailService;
        private readonly IValidator<BookSessionRequestDto> _bookSessionRequestValidator;
        private readonly IValidator<RescheduleSessionRequestDto> _rescheduleSessionValidator;
        private readonly IValidator<CancelSessionRequestDto> _cancelSessionValidator;


        public SessionService(
            ILogger<SessionService> logger,
            IMapper mapper,
            ISessionRepository sessionRepository,
            IMentorRepository mentorRepository,
            ITimeSlotRepository timeSlotRepository,
            ICancelSessionRepository cancelSessionRepository,
            IEmailService emailService,
            IRescheduleSessionRepository rescheduleSessionRepository,
            IValidator<BookSessionRequestDto> bookSessionRequestValidator,
            IValidator<RescheduleSessionRequestDto> rescheduleSessionValidator,
            IValidator<CancelSessionRequestDto> cancelSessionValidator)

        {
            _logger = logger;
            _mapper = mapper;
            _mentorRepository = mentorRepository;
            _timeSlotRepository = timeSlotRepository;
            _emailService = emailService;
            _sessionRepository = sessionRepository;
            _bookSessionRequestValidator = bookSessionRequestValidator;
            _rescheduleSessionRepository = rescheduleSessionRepository;
            _rescheduleSessionValidator = rescheduleSessionValidator;
            _cancelSessionRepository = cancelSessionRepository;
            _cancelSessionValidator = cancelSessionValidator;
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
            session.TimeSlotId = dto.TimeSlotId;


            await _sessionRepository.AddAsync(session);
            await _sessionRepository.SaveChangesAsync();

            timeSlot.IsBooked = true;
            timeSlot.SessionId = session.Id;

            _timeSlotRepository.Update(timeSlot);
            await _timeSlotRepository.SaveChangesAsync();

            return _mapper.Map<BookSessionResponseDto>(session);
        }



        public async Task<SessionDetailsResponseDto> GetSessionDetailsAsync(string sessionId, string userId, string userRole)
        {
            var session = await _sessionRepository.GetByIdWithRelationsAsync(sessionId);

            if (session == null)
                throw new NotFoundException("Session", sessionId);

            var isParticipant = (userRole == "User" && session.MenteeId == userId) ||
                                (userRole == "Mentor" && session.MentorId == userId) ||
                                (userRole == "Admin");

            if (!isParticipant)
                throw new UnauthorizedException("You don't have permission to view this session");

            var dto = _mapper.Map<SessionDetailsResponseDto>(session);

            return dto;
        }



        public async Task<List<UpCommingSessionsResponseDto>> GetUpcomingSessionsAsync(string userId, string userRole)
        {

            var allUpcomingSessions = await _sessionRepository.GetUpcomingSessionsAsync( userId,  userRole);


            //Empty List 
            if (allUpcomingSessions.Count == 0)
                throw new NotFoundException("No Upcomming Sessions ");


            var response = _mapper.Map<List<UpCommingSessionsResponseDto>>(allUpcomingSessions);

            return response;
        }


        public async Task<List<PastSessionsResponseDto>> GetPastSessionsAsync(string userId, string userRole)
        {
            var allPastSessions = await _sessionRepository.GetPastSessionsAsync(userId, userRole);

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
                throw new NotFoundException("Session not found.");


            bool isMentorRequester = session.Mentor.User.Id == userId;
            bool isMenteeRequester = session.Mentee.Id == userId;
            if (!isMentorRequester && !isMenteeRequester)
                throw new UnauthorizedException("You don't have permission to view this session as You are not a participant of this session.");


            bool mentorTimeSlotAvailable = await _timeSlotRepository.IsAvailableTimeSlotAsync(session.MentorId,
                                            dto.NewScheduledStartTime,
                                            (int)(session.Duration));

            if (!mentorTimeSlotAvailable)
                throw new ConflictException("Mentor has no available time at the requested slot.");

           

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

            BackgroundJob.Schedule<IRescheduleSessionService>(
            service => service.HandlePendingRescheduleAsync(rescheduleRequest.Id), // Implement => HandlePendingRescheduleAsync
            TimeSpan.FromHours(48));


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

            await SendRescheduleRequestEmailAsync(receiverEmail, receiverName, requesterName, session, rescheduleRequest);

            return _mapper.Map<RescheduleSessionResponseDto>(rescheduleRequest);

            //confirmation ?
            //rejection ?
            //schedulingsession entity  //Type of it will be confirmed / rejected 
            //session entity updates : RescheduleId , UpdatedAt 
            //session.RescheduleId = rescheduleRequest.Id;
            //session.UpdatedAt = DateTime.Now;
            //_sessionRepository.Update(session);
            //await _sessionRepository.SaveChangesAsync();

            //time slot updates => free the old , create new with booked = true  

        }


        public async Task<CancelSessionResponseDto> CancelSessionAsync(string sessionId, CancelSessionRequestDto dto,
                                                                        string userId, string role)
        {
            await _cancelSessionValidator.ValidateAndThrowCustomAsync(dto);

            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null)
                throw new NotFoundException("Session not found.");

            if (session.Status == SessionStatusOptions.Completed)
                throw new NotFoundException("Cannot cancel completed session.");


            bool isMentorRequester = session.Mentor.User.Id == userId;
            bool isMenteeRequester = session.Mentee.Id == userId;
            bool isAdmin = role == "Admin";

            if (!isMentorRequester && !isMenteeRequester && !isAdmin)
                throw new UnauthorizedException("You don't have permission to cancel this session.");



            var hoursUntilStart = (session.ScheduledStartTime - DateTime.UtcNow).TotalHours;

            int refundPercentage = 0;

            if (hoursUntilStart >= 48)
            {
                refundPercentage = 100;
            }
            else if (hoursUntilStart >= 24)
            {
                refundPercentage = 50;
            }

            var refundAmount = Math.Round((session.Price * refundPercentage / 100m), 2);

            var cancel = _mapper.Map<CancelSession>(dto);
            cancel.SessionId = session.Id;
            cancel.CancelledBy = role;
            cancel.Status = SessionStatusOptions.Cancelled;
            cancel.RefundPercentage = refundPercentage;
            cancel.RefundAmount = refundAmount;
            cancel.RefundStatus = RefundStatus.Pending;


            await _cancelSessionRepository.AddAsync(cancel);
            await _cancelSessionRepository.SaveChangesAsync();

            session.Status = SessionStatusOptions.Cancelled;
            session.CancellationReason = dto.Reason;
            session.TimeSlotId = null;
            _sessionRepository.Update(session);
            await _sessionRepository.SaveChangesAsync();


            var timeSlot = await _timeSlotRepository.GetByIdAsync(session.TimeSlotId);
            if (timeSlot != null)
            {
                timeSlot.IsBooked = false;
                timeSlot.SessionId = null;
                _timeSlotRepository.Update(timeSlot);
                await _timeSlotRepository.SaveChangesAsync();

            }

            await SendCancellationEmailsAsync(session.Mentee.Email, session.Mentor.User.Email, session, cancel);

            return _mapper.Map<CancelSessionResponseDto>(cancel);

        }



        public async Task<JoinSessionResponseDto> JoinSessionAsync(string sessionId, string userId)
        {

            var session = await _sessionRepository.GetByIdAsync(sessionId);

            if (session == null)
                throw new NotFoundException("Session not found.");

            if (session.MentorId != userId && session.MenteeId != userId)
                throw new UnauthorizedException("You are not a participant in this session.");

            if (session.Status != SessionStatusOptions.Confirmed)
                throw new ConflictException("Session is not confirmed yet and cannot be joined.");

            var earlyJoinLimit = session.ScheduledStartTime.AddMinutes(-15);
            var lateJoinLimit = session.ScheduledEndTime.AddMinutes(15);

           
            if (DateTime.UtcNow < earlyJoinLimit)
                throw new ConflictException("Session has not started yet. You can join 15 minutes before scheduled time.");

            if (DateTime.UtcNow > lateJoinLimit)
                throw new GoneException("The session has ended and can no longer be joined.");

            var dto = _mapper.Map<JoinSessionResponseDto>(session);


            dto.MinutesUntilStart = session.HoursUntilSession * 60;
            dto.CanJoinNow = DateTime.UtcNow >= earlyJoinLimit && DateTime.UtcNow <= lateJoinLimit && session.Status == SessionStatusOptions.Confirmed;
            dto.VideoConferenceLink = session.VideoConferenceLink; 
            dto.Provider =  "Zoom"; //may be changed 
            dto.Instructions = "Click the link to join the session. Please join 5 minutes early to test your audio and video.";

            return dto;
        }

        /*
        When Session Video is Goinggggg 
        Mark attendance when participant joins
        Update session status to "InProgress" when first participant joins
        */



        public async Task<CompleteSessionResponseDto> CompleteSessionAsync(string sessionId, string userId, string role)
        {
            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null)
                throw new NotFoundException("Session not found.");

            bool isMentor = session.MentorId == userId;
            bool isAdmin = role == "Admin";

            if (!isMentor && !isAdmin)
                throw new UnauthorizedException("Only the mentor or admin can mark session as completed.");

            if (session.Status == SessionStatusOptions.Completed)
                throw new ConflictException("Session is already marked as completed.");

            session.Status = SessionStatusOptions.Completed;
            session.CompletedAt = DateTime.UtcNow;

            //session.ActualDurationMinutes = recorded? 

            session.Payment.PaymentReleaseDate = session.CompletedAt.Value.AddHours(72); //Include ? 

            _sessionRepository.Update(session);
            await _sessionRepository.SaveChangesAsync();



            await SendCompletionEmailAsync(session.Mentee.Email, session);

            //Trigger 72 - hour payment hold(release after 3 days if no disputes)
            //Trigger review request email to mentee after 24 hours
            //Activate 3 - day chat window between mentor and mentee
            var dto = _mapper.Map<CompleteSessionResponseDto>(session);
            return dto;

        }


        private async Task SendRescheduleRequestEmailAsync(string receiverEmail, string receiverName,
                             string requesterName, Session session, RescheduleSession rescheduleRequest)
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

        private async Task SendCancellationEmailsAsync(string menteeEmail, string mentorEmail, Session session, CancelSession cancel)
        {
            EmailTemplates(cancel, session, out string menteeEmailTemplate, out string mentorEmailTemplate);

            await _emailService.SendEmailAsync(
                menteeEmail,
                "Session Cancellation",
                "Your session cancellation has been processed.",
                menteeEmailTemplate);

            await _emailService.SendEmailAsync(
                mentorEmail,
                "Session Cancellation",
                "A session cancellation has been processed.",
                mentorEmailTemplate);
        }


        private void EmailTemplates(CancelSession cancel, Session session, out string menteeEmailTemplate,
            out string mentorEmailTemplate)
        {
            if (cancel.RefundPercentage == 100)
            {
                menteeEmailTemplate = $@"
<html>
<body>
    <p>Dear Mentee,</p>
    <p>Your session scheduled on <strong>{session.ScheduledStartTime}</strong> has been <strong>cancelled</strong>.</p>
    <p>Since the cancellation is more than 48 hours before the session, you will receive a <strong>100% refund</strong> ({cancel.RefundAmount:C}).</p>
    <p>Thank you for using our platform.</p>
</body>
</html>";

                mentorEmailTemplate = $@"
<html>
<body>
    <p>Dear Mentor,</p>
    <p>The session scheduled on <strong>{session.ScheduledStartTime}</strong> has been <strong>cancelled</strong>.</p>
    <p>The mentee will receive a <strong>100% refund</strong> ({cancel.RefundAmount:C}).</p>
    <p>Please adjust your schedule accordingly.</p>
</body>
</html>";
            }
            else if (cancel.RefundPercentage == 50)
            {
                menteeEmailTemplate = $@"
<html>
<body>
    <p>Dear Mentee,</p>
    <p>Your session scheduled on <strong>{session.ScheduledStartTime}</strong> has been <strong>cancelled</strong>.</p>
    <p>Since the cancellation is 24–48 hours before the session, you will receive a <strong>50% refund</strong> ({cancel.RefundAmount:C}).</p>
    <p>Thank you for using our platform.</p>
</body>
</html>";

                mentorEmailTemplate = $@"
<html>
<body>
    <p>Dear Mentor,</p>
    <p>The session scheduled on <strong>{session.ScheduledStartTime}</strong> has been <strong>cancelled</strong>.</p>
    <p>The mentee will receive a <strong>50% refund</strong> ({cancel.RefundAmount:C}).</p>
    <p>Please adjust your schedule accordingly.</p>
</body>
</html>";
            }
            else // refundPercentage == 0
            {
                menteeEmailTemplate = $@"
<html>
<body>
    <p>Dear Mentee,</p>
    <p>Your session scheduled on <strong>{session.ScheduledStartTime}</strong> has been <strong>cancelled</strong>.</p>
    <p>Since the cancellation is less than 24 hours before the session, <strong>no refund</strong> will be issued.</p>
    <p>Thank you for using our platform.</p>
</body>
</html>";

                mentorEmailTemplate = $@"
<html>
<body>
    <p>Dear Mentor,</p>
    <p>The session scheduled on <strong>{session.ScheduledStartTime}</strong> has been <strong>cancelled</strong>.</p>
    <p>No refund will be issued to the mentee.</p>
    <p>Please adjust your schedule accordingly.</p>
</body>
</html>";
            }
        }


        private async Task SendCompletionEmailAsync(string menteeEmail, Session session)
        {

            string htmlContent = $"<p>Hi {session.Mentee.FirstName},</p>" +
                                 $"<p>Your session with <strong>{session.Mentor.User.FirstName}</strong> scheduled on <strong>{session.ScheduledStartTime:yyyy-MM-dd HH:mm}</strong> has been completed.</p>" +
                                 $"<p>You can now review the session ir provide feedback.</p>" +
                                 $"<p>Thank you for using our platform!</p>";

            // Send the email
            await _emailService.SendEmailAsync(
                menteeEmail,
                 "Session Completed",
                 "Your session is Completed .",
                htmlContent
            );
        }


    }


}

