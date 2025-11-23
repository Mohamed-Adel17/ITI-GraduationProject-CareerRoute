using AutoMapper;
using CareerRoute.Core.Constants;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.Domain.Interfaces.Services;
using CareerRoute.Core.DTOs;
using CareerRoute.Core.DTOs.Sessions;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Extentions;
using CareerRoute.Core.Services.Interfaces;
using FluentValidation;
using Hangfire;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;


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
        private readonly IEmailTemplateService _emailTemplateService;
        private readonly IPaymentProcessingService _paymentProcessingService;
        private readonly IValidator<BookSessionRequestDto> _bookSessionRequestValidator;
        private readonly IValidator<RescheduleSessionRequestDto> _rescheduleSessionValidator;
        private readonly IValidator<CancelSessionRequestDto> _cancelSessionValidator;
        private readonly IConfiguration _configuration;

        public SessionService(
            ILogger<SessionService> logger,
            IMapper mapper,
            ISessionRepository sessionRepository,
            IMentorRepository mentorRepository,
            ITimeSlotRepository timeSlotRepository,
            ICancelSessionRepository cancelSessionRepository,
            IEmailService emailService,
            IEmailTemplateService emailTemplateService,
            IPaymentProcessingService paymentProcessingService,
            IRescheduleSessionRepository rescheduleSessionRepository,
            IValidator<BookSessionRequestDto> bookSessionRequestValidator,
            IValidator<RescheduleSessionRequestDto> rescheduleSessionValidator,
            IValidator<CancelSessionRequestDto> cancelSessionValidator,
            IConfiguration configuration)
        {
            _logger = logger;
            _mapper = mapper;
            _mentorRepository = mentorRepository;
            _timeSlotRepository = timeSlotRepository;
            _emailService = emailService;
            _emailTemplateService = emailTemplateService;
            _paymentProcessingService = paymentProcessingService;
            _sessionRepository = sessionRepository;
            _bookSessionRequestValidator = bookSessionRequestValidator;
            _rescheduleSessionRepository = rescheduleSessionRepository;
            _rescheduleSessionValidator = rescheduleSessionValidator;
            _cancelSessionRepository = cancelSessionRepository;
            _cancelSessionValidator = cancelSessionValidator;
            _configuration = configuration;
        }


        public async Task<BookSessionResponseDto> BookSessionAsync(string menteeId, BookSessionRequestDto dto)
        {
            _logger.LogInformation("[Session] Mentee {MenteeId} attempting to book session for timeslot {TimeSlotId}", menteeId, dto.TimeSlotId);

            await _bookSessionRequestValidator.ValidateAndThrowCustomAsync(dto);

            await using var transaction = await _sessionRepository.BeginTransactionAsync();
            try
            {
                var timeSlot = await _timeSlotRepository.GetByIdAsync(dto.TimeSlotId);
                if (timeSlot == null)
                {
                    _logger.LogWarning("[Session] TimeSlot {TimeSlotId} not found", dto.TimeSlotId);
                    throw new NotFoundException("TimeSlot not found.");
                }

                if (timeSlot.IsBooked)
                {
                    _logger.LogWarning("[Session] TimeSlot {TimeSlotId} already booked", dto.TimeSlotId);
                    throw new ConflictException("TimeSlot is already booked.");
                }

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
                {
                    _logger.LogWarning("[Session] Mentee {MenteeId} has overlapping session", menteeId);
                    throw new ConflictException("You already have another session at this time.");
                }


                var session = _mapper.Map<Session>(dto);

                session.Id = Guid.NewGuid().ToString();
                session.MentorId = timeSlot.MentorId;
                session.MenteeId = menteeId;
                session.ScheduledStartTime = timeSlot.StartDateTime;
                session.ScheduledEndTime = timeSlot.StartDateTime.AddMinutes(timeSlot.DurationMinutes);
                session.Price = timeSlot.DurationMinutes == 30 ? mentor.Rate30Min :
                    timeSlot.DurationMinutes == 60 ? mentor.Rate60Min :
                    throw new ConflictException("Unsupported session duration for pricing.");

                // Session starts as Pending until payment is confirmed
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

                await transaction.CommitAsync();

                _logger.LogInformation("[Session] Session {SessionId} booked successfully by mentee {MenteeId} with mentor {MentorId}", session.Id, menteeId, session.MentorId);

                var bookingPeriodMinutes = _configuration.GetValue<int>("BookingPeriodMinutes", 15);
                BackgroundJob.Schedule<ISessionService>(
                    service => service.ReleaseUnpaidSessionAsync(session.Id),
                    TimeSpan.FromMinutes(bookingPeriodMinutes));

                // Reload session with relations for proper DTO mapping
                var sessionWithRelations = await _sessionRepository.GetByIdWithRelationsAsync(session.Id);
                return _mapper.Map<BookSessionResponseDto>(sessionWithRelations);
            }
            catch
            {
                _logger.LogError("[Session] Failed to book session for mentee {MenteeId}", menteeId);
                await transaction.RollbackAsync();
                throw;
            }
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



        public async Task<UpcomingSessionsResponse> GetUpcomingSessionsAsync(string userId, string userRole, int page, int pageSize)
        {

            var (allUpcomingSessions, totalCount) = await _sessionRepository.GetUpcomingSessionsAsync(userId, userRole, page, pageSize);


            //Empty List 
            if (allUpcomingSessions.Count == 0)
                throw new NotFoundException("No Upcomming Sessions ");


            var sessionDtos = _mapper.Map<List<UpcomingSessionItemResponseDto>>(allUpcomingSessions);

            var paginationMetadata = new PaginationMetadataDto
            {
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                HasNextPage = page * pageSize < totalCount,
                HasPreviousPage = page > 1
            };

            return new UpcomingSessionsResponse
            {
                Sessions = sessionDtos,
                Pagination = paginationMetadata
            };
        }


        public async Task<PastSessionsResponse> GetPastSessionsAsync(string userId, string userRole, int page, int pageSize)
        {
            var (allPastSessions, totalCount) = await _sessionRepository.GetPastSessionsAsync(userId, userRole, page, pageSize);

            if (allPastSessions.Count == 0)

                throw new NotFoundException("No Past Sessions ");

            var sessionDtos = _mapper.Map<List<PastSessionItemResponseDto>>(allPastSessions);

            var paginationMetadata = new PaginationMetadataDto
            {
                TotalCount = totalCount,
                CurrentPage = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                HasNextPage = page * pageSize < totalCount,
                HasPreviousPage = page > 1
            };

            return new PastSessionsResponse
            {
                Sessions = sessionDtos,
                Pagination = paginationMetadata
            };
        }


        public async Task<RescheduleSessionResponseDto> RescheduleSessionAsync(string sessionId, RescheduleSessionRequestDto dto,
                                                                                string userId, string role)
        {
            _logger.LogInformation("[Session] User {UserId} ({Role}) requesting reschedule for session {SessionId}", userId, role, sessionId);

            await _rescheduleSessionValidator.ValidateAndThrowCustomAsync(dto);

            var session = await _sessionRepository.GetByIdWithRelationsAsync(sessionId);
            if (session == null)
                throw new NotFoundException("Session not found.");

            if (session.ScheduledStartTime <= DateTime.UtcNow)
                throw new ConflictException("Cannot reschedule a session that has already started.");

            bool isMentorRequester = session.Mentor.User.Id == userId;
            bool isMenteeRequester = session.Mentee.Id == userId;
            if (!isMentorRequester && !isMenteeRequester)
                throw new UnauthorizedException("You don't have permission to view this session as You are not a participant of this session.");


            bool mentorTimeSlotAvailable = await _timeSlotRepository.HasOverlapAsync(
                                            session.MentorId,
                                            dto.NewScheduledStartTime,
                                            dto.NewScheduledStartTime.AddMinutes((int)session.Duration)
                                            );


            if (!mentorTimeSlotAvailable)
                throw new ConflictException("Mentor has no available time at the requested slot.");



            bool menteeAvailable = await _sessionRepository.IsMenteeAvailableAsync(session.MenteeId,
                                            dto.NewScheduledStartTime,
                                            (int)(session.Duration));

            if (!menteeAvailable)
                throw new ConflictException("Mentee has another session at this time.");


            var rescheduleSession = _mapper.Map<RescheduleSession>(dto);
            rescheduleSession.Id = Guid.NewGuid().ToString();
            rescheduleSession.SessionId = session.Id;
            rescheduleSession.OriginalStartTime = session.ScheduledStartTime;
            rescheduleSession.RequestedBy = role;
            rescheduleSession.Status = SessionRescheduleOptions.Pending;

            session.Status = SessionStatusOptions.PendingReschedule;
            _sessionRepository.Update(session);

            await _rescheduleSessionRepository.AddAsync(rescheduleSession);
            await _rescheduleSessionRepository.SaveChangesAsync();

            _logger.LogInformation("[Session] Reschedule request {RescheduleId} created for session {SessionId}. New time: {NewTime}", rescheduleSession.Id, session.Id, dto.NewScheduledStartTime);

            BackgroundJob.Schedule<IRescheduleSessionService>(
            service => service.HandlePendingRescheduleAsync(rescheduleSession.Id),
            TimeSpan.FromHours(SessionConstants.RescheduleApprovalTimeoutHours));


            string receiverEmail;
            string receiverName;
            string requesterName;

            if (isMentorRequester)
            {
                receiverEmail = session.Mentee.Email!;
                receiverName = session.Mentee.FirstName;
                requesterName = session.Mentor.User.FirstName;
            }
            else
            {
                receiverEmail = session.Mentor.User.Email!;
                receiverName = session.Mentor.User.FirstName;
                requesterName = session.Mentee.FirstName;
            }

            if (!string.IsNullOrEmpty(receiverEmail))
            {
                await SendRescheduleRequestEmailAsync(receiverEmail, receiverName, requesterName, rescheduleSession, session);
            }

            return _mapper.Map<RescheduleSessionResponseDto>(rescheduleSession);

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
            _logger.LogInformation("[Session] User {UserId} ({Role}) attempting to cancel session {SessionId}", userId, role, sessionId);

            await _cancelSessionValidator.ValidateAndThrowCustomAsync(dto);

            var session = await _sessionRepository.GetByIdWithRelationsAsync(sessionId);
            if (session == null)
                throw new NotFoundException("Session not found.");

            if (session.Status == SessionStatusOptions.Completed)
                throw new NotFoundException("Cannot cancel completed session.");


            bool isMentorRequester = session.MentorId == userId;
            bool isMenteeRequester = session.MenteeId == userId;
            bool isAdmin = role == "Admin";

            if (!isMentorRequester && !isMenteeRequester && !isAdmin)
                throw new UnauthorizedException("You don't have permission to cancel this session.");



            var hoursUntilStart = (session.ScheduledStartTime - DateTime.UtcNow).TotalHours;

            int refundPercentage = 0;

            if (hoursUntilStart >= SessionConstants.FullRefundHours)
            {
                refundPercentage = SessionConstants.FullRefundPercentage;
            }
            else if (hoursUntilStart >= SessionConstants.PartialRefundHours)
            {
                refundPercentage = SessionConstants.PartialRefundPercentage;
            }

            var refundAmount = Math.Round((session.Price * refundPercentage / 100m), 2);

            var cancel = _mapper.Map<CancelSession>(dto);
            cancel.Id = Guid.NewGuid().ToString();
            cancel.SessionId = session.Id;
            cancel.CancelledBy = role;
            cancel.Status = SessionStatusOptions.Cancelled;
            cancel.RefundPercentage = refundPercentage;
            cancel.RefundAmount = refundAmount;
            cancel.RefundStatus = RefundStatus.Pending;

            await using var transaction = await _sessionRepository.BeginTransactionAsync();
            try
            {
                await _cancelSessionRepository.AddAsync(cancel);
                await _cancelSessionRepository.SaveChangesAsync();

                session.Status = SessionStatusOptions.Cancelled;
                session.CancellationReason = dto.Reason;
                var timeSlotId = session.TimeSlotId;
                session.TimeSlotId = null;
                _sessionRepository.Update(session);
                await _sessionRepository.SaveChangesAsync();


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

                await transaction.CommitAsync();

                _logger.LogInformation("[Session] Session {SessionId} cancelled successfully. Refund: {RefundPercentage}% ({RefundAmount})", sessionId, refundPercentage, refundAmount);
            }
            catch
            {
                _logger.LogError("[Session] Failed to cancel session {SessionId}", sessionId);
                await transaction.RollbackAsync();
                throw;
            }

            // Process Refund if applicable
            if (refundAmount > 0 && !string.IsNullOrEmpty(session.PaymentId))
            {
                try
                {
                    _logger.LogInformation("[Session] Initiating refund for session {SessionId}. Amount: {RefundAmount}", sessionId, refundAmount);
                    await _paymentProcessingService.RefundPaymentAsync(session.PaymentId, refundPercentage);
                    _logger.LogInformation("[Session] Refund initiated successfully for session {SessionId}", sessionId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Session] Failed to process refund for session {SessionId}", sessionId);
                    // We don't throw here to avoid rolling back the cancellation, 
                    // but this should be alerted/monitored.
                }
            }

            // Send cancellation emails
            try
            {
                if (!string.IsNullOrEmpty(session.Mentee?.Email) && !string.IsNullOrEmpty(session.Mentor?.User?.Email))
                {
                    _logger.LogInformation("[Session] Sending cancellation emails for session {SessionId}", sessionId);
                    await SendCancellationEmailsAsync(session.Mentee.Email, session.Mentor.User.Email, session, cancel);
                    _logger.LogInformation("[Session] Cancellation emails sent successfully for session {SessionId}", sessionId);
                }
                else
                {
                    _logger.LogWarning("[Session] Cannot send cancellation emails - missing email addresses. Mentee: {MenteeEmail}, Mentor: {MentorEmail}",
                        session.Mentee?.Email ?? "null", session.Mentor?.User?.Email ?? "null");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Session] Failed to send cancellation emails for session {SessionId}", sessionId);
                // Don't throw - email failure shouldn't fail the cancellation
            }

            return _mapper.Map<CancelSessionResponseDto>(cancel);

        }



        public async Task<JoinSessionResponseDto> JoinSessionAsync(string sessionId, string userId)
        {
            _logger.LogInformation("[Session] User {UserId} attempting to join session {SessionId}", userId, sessionId);

            var session = await _sessionRepository.GetByIdAsync(sessionId);

            if (session == null)
                throw new NotFoundException("Session not found.");

            if (session.MentorId != userId && session.MenteeId != userId)
                throw new UnauthorizedException("You are not a participant in this session.");

            if (session.Status != SessionStatusOptions.Confirmed)
                throw new ConflictException("Session is not confirmed yet and cannot be joined.");

            var earlyJoinLimit = session.ScheduledStartTime.AddMinutes(-SessionConstants.EarlyJoinWindowMinutes);
            var lateJoinLimit = session.ScheduledEndTime.AddMinutes(SessionConstants.LateJoinWindowMinutes);


            if (DateTime.UtcNow < earlyJoinLimit)
                throw new ConflictException($"Session has not started yet. You can join {SessionConstants.EarlyJoinWindowMinutes} minutes before scheduled time.");

            if (DateTime.UtcNow > lateJoinLimit)
                throw new GoneException("The session has ended and can no longer be joined.");

            _logger.LogInformation("[Session] User {UserId} joined session {SessionId} successfully", userId, sessionId);

            var dto = _mapper.Map<JoinSessionResponseDto>(session);


            dto.MinutesUntilStart = (int)(session.ScheduledStartTime - DateTime.UtcNow).TotalMinutes;
            //dto.MinutesUntilStart = session.HoursUntilSession * 60;
            dto.CanJoinNow = DateTime.UtcNow >= earlyJoinLimit && DateTime.UtcNow <= lateJoinLimit && session.Status == SessionStatusOptions.Confirmed;
            dto.VideoConferenceLink = session.VideoConferenceLink ?? string.Empty;
            dto.Provider = "Zoom"; //may be changed 
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
            _logger.LogInformation("[Session] User {UserId} ({Role}) attempting to complete session {SessionId}", userId, role, sessionId);

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

            if (session.Payment != null)
            {
                session.Payment.PaymentReleaseDate = session.CompletedAt.Value.AddHours(72);
            }

            _sessionRepository.Update(session);
            await _sessionRepository.SaveChangesAsync();

            _logger.LogInformation("[Session] Session {SessionId} completed successfully by {Role}", sessionId, role);

            if (!string.IsNullOrEmpty(session.Mentee?.Email))
            {
                await SendCompletionEmailAsync(session.Mentee.Email, session);
            }

            //Trigger 72 - hour payment hold(release after 3 days if no disputes)
            //Trigger review request email to mentee after 24 hours
            //Activate 3 - day chat window between mentor and mentee
            var dto = _mapper.Map<CompleteSessionResponseDto>(session);
            return dto;

        }


        private async Task SendRescheduleRequestEmailAsync(string receiverEmail, string receiverName, string requesterName, RescheduleSession rescheduleRequest, Session session)
        {
            string htmlContent = _emailTemplateService.GenerateRescheduleRequestEmail(session, rescheduleRequest, receiverName, requesterName);

            await _emailService.SendEmailAsync(
                    receiverEmail,
                    "Session Reschedule Request",
                    "A session reschedule request has been submitted.",
                    htmlContent
            );
        }

        private async Task SendCancellationEmailsAsync(string menteeEmail, string mentorEmail, Session session, CancelSession cancel)
        {
            string menteeEmailTemplate = _emailTemplateService.GenerateCancellationEmail(session, cancel, true);
            string mentorEmailTemplate = _emailTemplateService.GenerateCancellationEmail(session, cancel, false);

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


        private async Task SendCompletionEmailAsync(string menteeEmail, Session session)
        {
            string htmlContent = _emailTemplateService.GenerateSessionCompletionEmail(session, session.Mentee.FirstName);

            // Send the email
            await _emailService.SendEmailAsync(
                menteeEmail,
                 "Session Completed",
                 "Your session is Completed .",
                htmlContent
            );
        }

        private async Task SendRescheduleApprovedEmailAsync(string requesterEmail, string requesterName, Session session, RescheduleSession reschedule)
        {
            string htmlContent = _emailTemplateService.GenerateRescheduleApprovedEmail(session, reschedule, requesterName);

            await _emailService.SendEmailAsync(
                requesterEmail,
                "Reschedule Request Approved",
                "Your reschedule request has been approved",
                htmlContent
            );
        }

        private async Task SendRescheduleRejectedEmailAsync(string requesterEmail, string requesterName, Session session, RescheduleSession reschedule)
        {
            string htmlContent = _emailTemplateService.GenerateRescheduleRejectedEmail(session, reschedule, requesterName);

            await _emailService.SendEmailAsync(
                requesterEmail,
                "Reschedule Request Rejected",
                "Your reschedule request has been rejected",
                htmlContent
            );
        }



        public async Task<RescheduleSessionResponseDto> ApproveRescheduleAsync(string rescheduleId, string userId, string role)
        {
            _logger.LogInformation("[Session] User {UserId} ({Role}) approving reschedule {RescheduleId}", userId, role, rescheduleId);

            var reschedule = await _rescheduleSessionRepository.GetByIdAsync(rescheduleId);
            if (reschedule == null)
                throw new NotFoundException("Reschedule request not found.");

            if (reschedule.Status != SessionRescheduleOptions.Pending)
                throw new ConflictException("Reschedule request has already been processed.");

            var session = await _sessionRepository.GetByIdWithRelationsAsync(reschedule.SessionId);
            if (session == null)
                throw new NotFoundException("Session not found.");

            bool isMentorApprover = session.MentorId == userId;
            bool isMenteeApprover = session.MenteeId == userId;
            bool isAdmin = role == "Admin";

            if (!isMentorApprover && !isMenteeApprover && !isAdmin)
                throw new UnauthorizedException("You don't have permission to approve this reschedule request.");

            await using var transaction = await _sessionRepository.BeginTransactionAsync();
            try
            {
                reschedule.Status = SessionRescheduleOptions.Approved;
                _rescheduleSessionRepository.Update(reschedule);
                await _rescheduleSessionRepository.SaveChangesAsync();

                var oldTimeSlotId = session.TimeSlotId;
                session.ScheduledStartTime = reschedule.NewScheduledStartTime;
                session.ScheduledEndTime = reschedule.NewScheduledStartTime.AddMinutes((int)session.Duration);
                session.UpdatedAt = DateTime.UtcNow;
                _sessionRepository.Update(session);
                await _sessionRepository.SaveChangesAsync();

                if (!string.IsNullOrEmpty(oldTimeSlotId))
                {
                    var oldTimeSlot = await _timeSlotRepository.GetByIdAsync(oldTimeSlotId);
                    if (oldTimeSlot != null)
                    {
                        oldTimeSlot.IsBooked = false;
                        oldTimeSlot.SessionId = null;
                        _timeSlotRepository.Update(oldTimeSlot);
                        await _timeSlotRepository.SaveChangesAsync();
                    }
                }

                await transaction.CommitAsync();

                _logger.LogInformation("[Session] Reschedule {RescheduleId} approved. Session {SessionId} updated to new time: {NewTime}", rescheduleId, session.Id, reschedule.NewScheduledStartTime);
            }
            catch
            {
                _logger.LogError("[Session] Failed to approve reschedule {RescheduleId}", rescheduleId);
                await transaction.RollbackAsync();
                throw;
            }

            // Send email to requester
            string requesterEmail = reschedule.RequestedBy == "Mentor" ? session.Mentor.User.Email! : session.Mentee.Email!;
            string requesterName = reschedule.RequestedBy == "Mentor" ? session.Mentor.User.FirstName : session.Mentee.FirstName;
            await SendRescheduleApprovedEmailAsync(requesterEmail, requesterName, session, reschedule);

            return _mapper.Map<RescheduleSessionResponseDto>(reschedule);
        }

        public async Task<RescheduleSessionResponseDto> RejectRescheduleAsync(string rescheduleId, string userId, string role)
        {
            _logger.LogInformation("[Session] User {UserId} ({Role}) rejecting reschedule {RescheduleId}", userId, role, rescheduleId);

            var reschedule = await _rescheduleSessionRepository.GetByIdAsync(rescheduleId);
            if (reschedule == null)
                throw new NotFoundException("Reschedule request not found.");

            if (reschedule.Status != SessionRescheduleOptions.Pending)
                throw new ConflictException("Reschedule request has already been processed.");

            var session = await _sessionRepository.GetByIdWithRelationsAsync(reschedule.SessionId);
            if (session == null)
                throw new NotFoundException("Session not found.");

            bool isMentorApprover = session.MentorId == userId;
            bool isMenteeApprover = session.MenteeId == userId;
            bool isAdmin = role == "Admin";

            if (!isMentorApprover && !isMenteeApprover && !isAdmin)
                throw new UnauthorizedException("You don't have permission to reject this reschedule request.");

            reschedule.Status = SessionRescheduleOptions.Rejected;
            _rescheduleSessionRepository.Update(reschedule);
            await _rescheduleSessionRepository.SaveChangesAsync();

            _logger.LogInformation("[Session] Reschedule {RescheduleId} rejected. Session {SessionId} remains at original time", rescheduleId, session.Id);

            // Send email to requester
            string requesterEmail = reschedule.RequestedBy == "Mentor" ? session.Mentor.User.Email! : session.Mentee.Email!;
            string requesterName = reschedule.RequestedBy == "Mentor" ? session.Mentor.User.FirstName : session.Mentee.FirstName;
            await SendRescheduleRejectedEmailAsync(requesterEmail, requesterName, session, reschedule);

            return _mapper.Map<RescheduleSessionResponseDto>(reschedule);
        }

        public async Task ReleaseUnpaidSessionAsync(string sessionId)
        {
            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null) return;

            if (session.Status == SessionStatusOptions.Pending && string.IsNullOrEmpty(session.PaymentId))
            {
                var timeSlotId = session.TimeSlotId; // Capture ID before nulling

                session.Status = SessionStatusOptions.Cancelled;
                session.CancellationReason = "Payment timeout";
                session.TimeSlotId = null; // Release the slot relation
                _sessionRepository.Update(session);
                await _sessionRepository.SaveChangesAsync();

                // Release the TimeSlot
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
        }
    }


}

