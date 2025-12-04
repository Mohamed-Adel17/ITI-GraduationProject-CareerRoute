using AutoMapper;
using CareerRoute.Core.Constants;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.Domain.Interfaces.Services;
using CareerRoute.Core.DTOs;
using CareerRoute.Core.DTOs.Sessions;
using CareerRoute.Core.DTOs.Zoom;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Extentions;
using CareerRoute.Core.Prompts;
using CareerRoute.Core.Services.Interfaces;
using FluentValidation;
using Hangfire;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
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
        private readonly IRescheduleSessionRepository _rescheduleSessionRepository;
        private readonly ICancelSessionRepository _cancelSessionRepository;
        private readonly IEmailService _emailService;
        private readonly IEmailTemplateService _emailTemplateService;
        private readonly IPaymentProcessingService _paymentProcessingService;
        private readonly IValidator<BookSessionRequestDto> _bookSessionRequestValidator;
        private readonly IValidator<RescheduleSessionRequestDto> _rescheduleSessionValidator;
        private readonly IValidator<CancelSessionRequestDto> _cancelSessionValidator;
        private readonly IConfiguration _configuration;

        // Zoom / media dependencies
        private readonly IUserRepository _userRepository;
        private readonly IZoomService _zoomService;
        private readonly ICalendarService _calendarService;
        private readonly IDeepgramService _deepgramService;
        private readonly IBlobStorageService _blobStorageService;
        private readonly IJobScheduler _jobScheduler;
        
        // Notification service for real-time notifications
        private readonly ISignalRNotificationService _notificationService;
        
        // Session reminder job service for scheduling/cancelling reminders
        private readonly ISessionReminderJobService _sessionReminderJobService;

        // AI client for generating preparation guides
        private readonly IAiClient _aiClient;

        // Semaphore for sequential processing of reschedule requests
        private static readonly SemaphoreSlim _rescheduleLock = new SemaphoreSlim(1, 1);

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
            IConfiguration configuration,
            IUserRepository userRepository,
            IZoomService zoomService,
            ICalendarService calendarService,
            IDeepgramService deepgramService,
            IBlobStorageService blobStorageService,
            IJobScheduler jobScheduler,
            ISignalRNotificationService notificationService,
            ISessionReminderJobService sessionReminderJobService,
            IAiClient aiClient)
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

            _userRepository = userRepository;
            _zoomService = zoomService;
            _calendarService = calendarService;
            _deepgramService = deepgramService;
            _blobStorageService = blobStorageService;
            _jobScheduler = jobScheduler;
            _notificationService = notificationService;
            _sessionReminderJobService = sessionReminderJobService;
            _aiClient = aiClient;
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
                // Schedule cleanup job IMMEDIATELY after commit - critical for data integrity
                var bookingPeriodMinutes = _configuration.GetValue<int>("BookingPeriodMinutes", 15);
                var jobId = BackgroundJob.Schedule<ISessionService>(
                    service => service.ReleaseUnpaidSessionAsync(session.Id),
                    TimeSpan.FromMinutes(bookingPeriodMinutes));
                
                _logger.LogInformation("[Session] Session {SessionId} booked successfully by mentee {MenteeId} with mentor {MentorId}. Scheduled ReleaseUnpaidSessionAsync job {JobId} in {Minutes} min", session.Id, menteeId, session.MentorId, jobId, bookingPeriodMinutes);
                
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

            // Populate RescheduleId if session has a pending reschedule
            if (session.Status == SessionStatusOptions.PendingReschedule && session.Reschedule != null)
            {
                dto.RescheduleId = session.Reschedule.Id;
                dto.RescheduleRequestedBy = session.Reschedule.RequestedBy;
            }

            // Include AI preparation fields only for mentor (not for mentees)
            var isMentor = session.MentorId == userId;
            if (!isMentor)
            {
                dto.AIPreparationGuide = null;
                dto.AIPreparationGeneratedAt = null;
            }

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

            // If slotId is provided (mentee rescheduling to a specific slot)
            if (!string.IsNullOrEmpty(dto.SlotId))
            {
                var slot = await _timeSlotRepository.GetByIdAsync(dto.SlotId);
                if (slot == null)
                    throw new NotFoundException("Time slot not found.");
                if (slot.IsBooked)
                    throw new ConflictException("The selected time slot is no longer available.");
                if (slot.MentorId != session.MentorId)
                    throw new BusinessException("The selected slot does not belong to this session's mentor.");

                // Use slot's start time
                dto.NewScheduledStartTime = slot.StartDateTime;
            }
            else
            {
                // Only check mentor overlap when no slotId provided (mentor rescheduling to arbitrary time)
                bool mentorHasOverlap = await _timeSlotRepository.HasOverlapAsync(
                                                session.MentorId,
                                                dto.NewScheduledStartTime,
                                                dto.NewScheduledStartTime.AddMinutes((int)session.Duration)
                                                );

                if (mentorHasOverlap)
                    throw new ConflictException("Mentor has no available time at the requested slot.");
            }

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

            // Send real-time notification to the other participant
            try
            {
                var newScheduledTime = dto.NewScheduledStartTime.ToString("MMM dd, yyyy 'at' h:mm tt");
                var receiverId = isMentorRequester ? session.MenteeId : session.MentorId;
                var path = isMentorRequester ?$"user/sessions/{sessionId}" : $"mentor/sessions/{sessionId}";
                await _notificationService.SendNotificationAsync(
                    receiverId,
                    NotificationType.RescheduleRequested,
                    "Reschedule Request",
                    $"{requesterName} has requested to reschedule your session to {newScheduledTime}. Please review and respond.",
                    path);
                
                _logger.LogInformation("[Session] Reschedule request notification sent for session {SessionId}", sessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Session] Failed to send reschedule request notification for session {SessionId}", sessionId);
                // Don't throw - notification failure shouldn't fail the reschedule request
            }

            return _mapper.Map<RescheduleSessionResponseDto>(rescheduleSession);

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
                
                // Cancel the scheduled reminder job
                if (!string.IsNullOrEmpty(session.ReminderJobId))
                {
                    _sessionReminderJobService.CancelReminder(session.ReminderJobId);
                    _logger.LogInformation("[Session] Cancelled reminder job {JobId} for session {SessionId}", session.ReminderJobId, sessionId);
                }
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

            // Send real-time notifications to affected participant
            try
            {
                var cancellerName = isMentorRequester ? session.Mentor?.User?.FirstName : session.Mentee?.FirstName;
                var scheduledTime = session.ScheduledStartTime.ToString("MMM dd, yyyy 'at' h:mm tt");
                
                // Notify the other participant (not the one who cancelled)
                if (isMentorRequester && !string.IsNullOrEmpty(session.MenteeId))
                {
                    await _notificationService.SendNotificationAsync(
                        session.MenteeId,
                        NotificationType.SessionCancelled,
                        "Session Cancelled",
                        $"Your session with {cancellerName} scheduled for {scheduledTime} has been cancelled.",
                        $"user/sessions/{sessionId}");
                }
                else if (isMenteeRequester && !string.IsNullOrEmpty(session.MentorId))
                {
                    await _notificationService.SendNotificationAsync(
                        session.MentorId,
                        NotificationType.SessionCancelled,
                        "Session Cancelled",
                        $"Your session with {cancellerName} scheduled for {scheduledTime} has been cancelled.",
                        $"mentor/sessions/{sessionId}");
                }
                
                _logger.LogInformation("[Session] Cancellation notification sent for session {SessionId}", sessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Session] Failed to send cancellation notification for session {SessionId}", sessionId);
                // Don't throw - notification failure shouldn't fail the cancellation
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

            if (session.Status != SessionStatusOptions.Confirmed && session.Status != SessionStatusOptions.InProgress)
                throw new ConflictException("Session is not confirmed yet and cannot be joined.");

            var earlyJoinLimit = session.ScheduledStartTime.AddMinutes(-SessionConstants.EarlyJoinWindowMinutes);
            var lateJoinLimit = session.ScheduledEndTime.AddMinutes(SessionConstants.LateJoinWindowMinutes);


            if (DateTime.UtcNow < earlyJoinLimit)
                throw new ConflictException($"Session has not started yet. You can join {SessionConstants.EarlyJoinWindowMinutes} minutes before scheduled time.");

            if (DateTime.UtcNow > lateJoinLimit)
                throw new GoneException("The session has ended and can no longer be joined.");

            // Check if Zoom meeting is ready
            if (string.IsNullOrEmpty(session.VideoConferenceLink))
            {
                _logger.LogInformation("[Session] Video conference link not ready for session {SessionId}, queueing retry", sessionId);
                
                // Queue background job to create Zoom meeting (in case it failed before)
                _jobScheduler.EnqueueAsync<ISessionService>(svc => svc.CreateZoomMeetingForSessionAsync(sessionId));
                
                throw new ConflictException("Zoom meeting is being prepared. Please try again in 2-3 minutes.");
            }

            _logger.LogInformation("[Session] User {UserId} joined session {SessionId} successfully", userId, sessionId);

            var dto = _mapper.Map<JoinSessionResponseDto>(session);


            dto.MinutesUntilStart = (int)(session.ScheduledStartTime - DateTime.UtcNow).TotalMinutes;
            //dto.MinutesUntilStart = session.HoursUntilSession * 60;
            dto.CanJoinNow = DateTime.UtcNow >= earlyJoinLimit && DateTime.UtcNow <= lateJoinLimit && 
                             (session.Status == SessionStatusOptions.Confirmed || session.Status == SessionStatusOptions.InProgress);
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
                session.Status = SessionStatusOptions.Confirmed; // Restore status after approval
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

            // Update Zoom meeting if exists
            if (session.ZoomMeetingId.HasValue)
            {
                try
                {
                    await _zoomService.UpdateMeetingAsync(session.ZoomMeetingId.Value, session.Id, session.ScheduledStartTime, session.ScheduledEndTime);
                    _logger.LogInformation("[Session] Updated Zoom meeting for rescheduled session {SessionId}", session.Id);

                    // Re-schedule Zoom link email 15 minutes before new start time
                    var emailDelay = session.ScheduledStartTime.AddMinutes(-15) - DateTime.UtcNow;
                    if (emailDelay > TimeSpan.Zero)
                    {
                        _jobScheduler.Schedule<ISessionService>(
                            svc => svc.SendZoomLinkEmailAsync(session.Id),
                            emailDelay);
                    }
                    else if (session.ScheduledStartTime > DateTime.UtcNow)
                    {
                        // Session starts in less than 15 minutes, send immediately
                        _jobScheduler.EnqueueAsync<ISessionService>(svc => svc.SendZoomLinkEmailAsync(session.Id));
                    }

                    // Re-schedule auto-termination
                    var terminationDelay = session.ScheduledEndTime.AddMinutes(2) - DateTime.UtcNow;
                    if (terminationDelay > TimeSpan.Zero)
                    {
                        _jobScheduler.Schedule<ISessionService>(
                            svc => svc.AutoTerminateSessionAsync(session.Id),
                            terminationDelay);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Session] Failed to update Zoom meeting for rescheduled session {SessionId}", session.Id);
                }
            }

            // Cancel old reminder and schedule new one for the rescheduled time
            try
            {
                // Cancel the old reminder job
                if (!string.IsNullOrEmpty(session.ReminderJobId))
                {
                    _sessionReminderJobService.CancelReminder(session.ReminderJobId);
                    _logger.LogInformation("[Session] Cancelled old reminder job {JobId} for rescheduled session {SessionId}", session.ReminderJobId, session.Id);
                }
                
                // Schedule new reminder for the new time
                var mentorName = $"{session.Mentor?.User?.FirstName} {session.Mentor?.User?.LastName}";
                var menteeName = $"{session.Mentee?.FirstName} {session.Mentee?.LastName}";
                var newReminderJobId = _sessionReminderJobService.ScheduleReminder(
                    session.Id,
                    session.MentorId,
                    session.MenteeId,
                    mentorName,
                    menteeName,
                    session.ScheduledStartTime);
                
                if (!string.IsNullOrEmpty(newReminderJobId))
                {
                    session.ReminderJobId = newReminderJobId;
                    _sessionRepository.Update(session);
                    await _sessionRepository.SaveChangesAsync();
                    _logger.LogInformation("[Session] Scheduled new reminder job {JobId} for rescheduled session {SessionId}", newReminderJobId, session.Id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Session] Failed to reschedule reminder for session {SessionId}", session.Id);
                // Don't throw - reminder scheduling failure shouldn't fail the reschedule approval
            }

            // Send email to requester
            string requesterEmail = reschedule.RequestedBy == "Mentor" ? session.Mentor.User.Email! : session.Mentee.Email!;
            string requesterName = reschedule.RequestedBy == "Mentor" ? session.Mentor.User.FirstName : session.Mentee.FirstName;
            await SendRescheduleApprovedEmailAsync(requesterEmail, requesterName, session, reschedule);

            // Send real-time notification to the requester
            try
            {
                var isRequestByMentor = reschedule.RequestedBy == "Mentor";
                var requesterId = isRequestByMentor ? session.MentorId : session.MenteeId;
                var path = isRequestByMentor ? $"mentor/sessions/{session.Id}": $"user/sessions/{session.Id}";
                var newScheduledTime = reschedule.NewScheduledStartTime.ToString("MMM dd, yyyy 'at' h:mm tt");
                await _notificationService.SendNotificationAsync(
                    requesterId,
                    NotificationType.RescheduleApproved,
                    "Reschedule Approved",
                    $"Your reschedule request has been approved. Your session is now scheduled for {newScheduledTime}.",
                    path);
                
                _logger.LogInformation("[Session] Reschedule approved notification sent for session {SessionId}", session.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Session] Failed to send reschedule approved notification for session {SessionId}", session.Id);
                // Don't throw - notification failure shouldn't fail the approval
            }

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

            // Restore session status back to Confirmed after rejection
            session.Status = SessionStatusOptions.Confirmed;
            session.UpdatedAt = DateTime.UtcNow;
            _sessionRepository.Update(session);
            await _sessionRepository.SaveChangesAsync();

            _logger.LogInformation("[Session] Reschedule {RescheduleId} rejected. Session {SessionId} remains at original time", rescheduleId, session.Id);

            // Send email to requester
            string requesterEmail = reschedule.RequestedBy == "Mentor" ? session.Mentor.User.Email! : session.Mentee.Email!;
            string requesterName = reschedule.RequestedBy == "Mentor" ? session.Mentor.User.FirstName : session.Mentee.FirstName;
            await SendRescheduleRejectedEmailAsync(requesterEmail, requesterName, session, reschedule);

            // Send real-time notification to the requester
            try
            {

                var isRequestByMentor = reschedule.RequestedBy == "Mentor";
                var requesterId = isRequestByMentor ? session.MentorId : session.MenteeId;
                var path = isRequestByMentor ? $"mentor/sessions/{session.Id}" : $"user/sessions/{session.Id}";
                var originalScheduledTime = session.ScheduledStartTime.ToString("MMM dd, yyyy 'at' h:mm tt");
                
                await _notificationService.SendNotificationAsync(
                    requesterId,
                    NotificationType.RescheduleRejected,
                    "Reschedule Rejected",
                    $"Your reschedule request has been rejected. Your session remains scheduled for {originalScheduledTime}.",
                    $"/sessions/{session.Id}");
                
                _logger.LogInformation("[Session] Reschedule rejected notification sent for session {SessionId}", session.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Session] Failed to send reschedule rejected notification for session {SessionId}", session.Id);
                // Don't throw - notification failure shouldn't fail the rejection
            }

            return _mapper.Map<RescheduleSessionResponseDto>(reschedule);
        }

        public async Task<RescheduleDetailsDto> GetRescheduleDetailsAsync(string rescheduleId, string userId, string role)
        {
            var reschedule = await _rescheduleSessionRepository.GetByIdAsync(rescheduleId);
            if (reschedule == null)
                throw new NotFoundException("Reschedule request not found.");

            var session = await _sessionRepository.GetByIdWithRelationsAsync(reschedule.SessionId);
            if (session == null)
                throw new NotFoundException("Session not found.");

            bool isMentor = session.MentorId == userId;
            bool isMentee = session.MenteeId == userId;
            bool isAdmin = role == "Admin";

            if (!isMentor && !isMentee && !isAdmin)
                throw new UnauthorizedException("You don't have permission to view this reschedule request.");

            return new RescheduleDetailsDto
            {
                RescheduleId = reschedule.Id,
                SessionId = session.Id,
                Status = reschedule.Status.ToString(),
                MentorName = $"{session.Mentor.User.FirstName} {session.Mentor.User.LastName}",
                MenteeName = $"{session.Mentee.FirstName} {session.Mentee.LastName}",
                Topic = session.Topic,
                OriginalStartTime = reschedule.OriginalStartTime,
                NewStartTime = reschedule.NewScheduledStartTime,
                RequestedBy = reschedule.RequestedBy,
                RescheduleReason = reschedule.RescheduleReason,
                RequestedAt = reschedule.RequestedAt
            };
        }

        public async Task ReleaseUnpaidSessionAsync(string sessionId)
        {
            _logger.LogInformation("[Session] Checking if session {SessionId} should be released due to no payment", sessionId);

            await using var transaction = await _sessionRepository.BeginTransactionAsync();
            try
            {
                var session = await _sessionRepository.GetByIdAsync(sessionId);
                if (session == null)
                {
                    _logger.LogWarning("[Session] Session {SessionId} not found for release check", sessionId);
                    return;
                }

                // Only release if still pending and no payment created
                if (session.Status == SessionStatusOptions.Pending && string.IsNullOrEmpty(session.PaymentId))
                {
                    var timeSlotId = session.TimeSlotId;

                    session.Status = SessionStatusOptions.Cancelled;
                    session.CancellationReason = "Payment not initiated within booking period";
                    session.TimeSlotId = null;
                    session.UpdatedAt = DateTime.UtcNow;

                    _sessionRepository.Update(session);
                    await _sessionRepository.SaveChangesAsync();

                    // Free the TimeSlot
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

                    _logger.LogInformation("[Session] Session {SessionId} automatically released - no payment initiated", sessionId);
                }
                else
                {
                    _logger.LogInformation("[Session] Session {SessionId} not released. Status: {Status}, HasPayment: {HasPayment}",
                        sessionId, session.Status, !string.IsNullOrEmpty(session.PaymentId));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Session] Error releasing unpaid session {SessionId}", sessionId);
                await transaction.RollbackAsync();
                throw;
            }
        }

        #region Zoom and media workflows

        public async Task CreateZoomMeetingForSessionAsync(string sessionId)
        {
            _logger.LogInformation("[Session] Creating Zoom meeting for session: {SessionId}", sessionId);

            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null)
            {
                _logger.LogError("[Session] Session not found: {SessionId}", sessionId);
                throw new NotFoundException("Session", sessionId);
            }

            if (session.ZoomMeetingId.HasValue)
            {
                _logger.LogWarning("[Session] Session {SessionId} already has a Zoom meeting: {MeetingId}", sessionId, session.ZoomMeetingId.Value);
                return;
            }

            int maxRetries = 3;
            int attempt = 0;
            Exception? lastException = null;

            while (attempt < maxRetries)
            {
                try
                {
                    attempt++;
                    _logger.LogInformation("[Session] Attempting to create Zoom meeting for session {SessionId}, attempt {Attempt}/{MaxRetries}", sessionId, attempt, maxRetries);

                    var createRequest = new CreateZoomMeetingRequest
                    {
                        Topic = session.Topic ?? $"Mentorship Session - {session.Id}",
                        StartTime = session.ScheduledStartTime,
                        DurationMinutes = (int)(session.ScheduledEndTime - session.ScheduledStartTime).TotalMinutes,
                        Timezone = "UTC"
                    };

                    var zoomMeeting = await _zoomService.CreateMeetingAsync(createRequest, sessionId);

                    session.ZoomMeetingId = zoomMeeting.Id;
                    session.VideoConferenceLink = zoomMeeting.JoinUrl;
                    session.ZoomMeetingPassword = zoomMeeting.Password;

                    _sessionRepository.Update(session);
                    await _sessionRepository.SaveChangesAsync();

                    _logger.LogInformation("[Session] Zoom meeting created for session {SessionId}: MeetingId={MeetingId}", sessionId, zoomMeeting.Id);

                    // Schedule Zoom link email 15 minutes before session start
                    var emailDelay = session.ScheduledStartTime.AddMinutes(-15) - DateTime.UtcNow;
                    if (emailDelay > TimeSpan.Zero)
                    {
                        _jobScheduler.Schedule<ISessionService>(
                            svc => svc.SendZoomLinkEmailAsync(session.Id),
                            emailDelay);
                        _logger.LogInformation("[Session] Scheduled Zoom link email for session {SessionId} at {ScheduledTime}", 
                            sessionId, session.ScheduledStartTime.AddMinutes(-15));
                    }
                    else
                    {
                        // Session starts in less than 15 minutes, send email immediately
                        _jobScheduler.EnqueueAsync<ISessionService>(svc => svc.SendZoomLinkEmailAsync(session.Id));
                        _logger.LogInformation("[Session] Session {SessionId} starts soon, sending Zoom link email immediately", sessionId);
                    }

                    // Schedule marking session as InProgress at start time
                    var inProgressDelay = session.ScheduledStartTime - DateTime.UtcNow;
                    if (inProgressDelay > TimeSpan.Zero)
                    {
                        _jobScheduler.Schedule<ISessionService>(
                            svc => svc.MarkSessionAsInProgressByIdAsync(session.Id),
                            inProgressDelay);
                        _logger.LogInformation("[Session] Scheduled InProgress status update for session {SessionId} at {ScheduledTime}", 
                            sessionId, session.ScheduledStartTime);
                    }
                    else
                    {
                        // Session already started, mark as InProgress immediately
                        _jobScheduler.EnqueueAsync<ISessionService>(svc => svc.MarkSessionAsInProgressByIdAsync(session.Id));
                        _logger.LogInformation("[Session] Session {SessionId} already started, marking as InProgress immediately", sessionId);
                    }

                    // Schedule automatic meeting termination (ScheduledEndTime + 2 minutes grace period)
                    var terminationDelay = session.ScheduledEndTime.AddMinutes(2) - DateTime.UtcNow;
                    if (terminationDelay < TimeSpan.Zero) terminationDelay = TimeSpan.Zero;
                    _jobScheduler.Schedule<ISessionService>(
                        svc => svc.AutoTerminateSessionAsync(session.Id),
                        terminationDelay);
                    _logger.LogInformation("[Session] Scheduled auto-termination for session {SessionId} at {ScheduledTime}", 
                        sessionId, session.ScheduledEndTime.AddMinutes(2));

                    return;
                }
                catch (Exception ex)
                {
                    lastException = ex;
                    _logger.LogWarning(ex, "[Session] Attempt {Attempt} to create Zoom meeting failed for session {SessionId}", attempt, sessionId);
                    await Task.Delay(TimeSpan.FromSeconds(2 * attempt));
                }
            }

            _logger.LogError(lastException, "[Session] Failed to create Zoom meeting for session {SessionId} after {MaxRetries} attempts", sessionId, maxRetries);
            throw new BusinessException("Failed to create Zoom meeting after multiple attempts.");
        }

        public async Task<SessionRecordingDto> GetSessionRecordingAsync(string sessionId, string userId)
        {
            _logger.LogInformation("[Session] Fetching recording for session {SessionId} by user {UserId}", sessionId, userId);

            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null) throw new NotFoundException("Session", sessionId);

            if (session.MentorId != userId && session.MenteeId != userId)
            {
                throw new UnauthorizedException("You are not authorized to view this recording.");
            }

            // Check if video is stored in R2
            if (string.IsNullOrEmpty(session.VideoStorageKey))
            {
                _logger.LogInformation("[Session] Recording not yet available for session {SessionId}. RecordingProcessed: {Processed}", 
                    sessionId, session.RecordingProcessed);
                
                return new SessionRecordingDto
                {
                    SessionId = sessionId,
                    RecordingPlayUrl = string.Empty,
                    PlayUrl = string.Empty,
                    AccessToken = string.Empty,
                    ExpiresAt = DateTime.UtcNow,
                    IsAvailable = false,
                    Status = session.RecordingProcessed ? "Failed" : "Processing",
                    AvailableAt = null,
                    Transcript = null
                };
            }

            // Generate R2 presigned URL with "inline" disposition for browser streaming
            var presignedUrl = _blobStorageService.GetPresignedUrl(
                session.VideoStorageKey, 
                TimeSpan.FromMinutes(60), 
                "inline");

            _logger.LogInformation("[Session] Generated presigned URL for session {SessionId} recording", sessionId);

            return new SessionRecordingDto
            {
                SessionId = sessionId,
                RecordingPlayUrl = presignedUrl,
                PlayUrl = presignedUrl,
                AccessToken = string.Empty,
                ExpiresAt = DateTime.UtcNow.AddMinutes(60),
                IsAvailable = true,
                Status = "Available",
                AvailableAt = session.RecordingAvailableAt ?? session.CompletedAt ?? session.UpdatedAt,
                Transcript = session.Transcript
            };
        }

        public async Task<string> GetSessionTranscriptAsync(string sessionId, string userId)
        {
            _logger.LogInformation("[Session] Fetching transcript for session {SessionId} by user {UserId}", sessionId, userId);

            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null) throw new NotFoundException("Session", sessionId);

            if (session.MentorId != userId && session.MenteeId != userId)
            {
                throw new UnauthorizedException("You are not authorized to view this transcript.");
            }

            if (string.IsNullOrEmpty(session.Transcript))
            {
                throw new NotFoundException("Transcript not available yet");
            }

            return session.Transcript;
        }

        public async Task<string> GetSessionSummaryAsync(string sessionId, string userId)
        {
            _logger.LogInformation("[Session] Fetching summary for session {SessionId} by user {UserId}", sessionId, userId);

            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null) throw new NotFoundException("Session", sessionId);

            if (session.MentorId != userId && session.MenteeId != userId)
            {
                throw new UnauthorizedException("You are not authorized to view this summary.");
            }

            if (string.IsNullOrEmpty(session.Transcript))
            {
                throw new NotFoundException("Transcript not available yet. Please wait for session recording to be processed.");
            }

            if (string.IsNullOrEmpty(session.Summary))
            {
                throw new NotFoundException("Summary is being generated. Please try again in a few moments.");
            }

            return session.Summary;
        }

        public async Task<GeneratePreparationResponseDto> GeneratePreparationAsync(string sessionId, string userId)
        {
            _logger.LogInformation("[Session] Generating AI preparation for session {SessionId} by user {UserId}", sessionId, userId);

            var session = await _sessionRepository.GetByIdWithRelationsAsync(sessionId);
            if (session == null) throw new NotFoundException("Session", sessionId);

            // Only mentor can generate preparation
            if (session.MentorId != userId)
                throw new UnauthorizedException("Only the session mentor can generate preparation guides.");

            // Cannot generate for completed/cancelled sessions
            var invalidStatuses = new[] { SessionStatusOptions.Completed, SessionStatusOptions.Cancelled, SessionStatusOptions.NoShow };
            if (invalidStatuses.Contains(session.Status))
                throw new BusinessException("Cannot generate preparation for completed, cancelled, or no-show sessions.");

            // Return existing if already generated
            if (!string.IsNullOrEmpty(session.AIPreparationGuide))
            {
                return new GeneratePreparationResponseDto
                {
                    SessionId = sessionId,
                    PreparationGuide = session.AIPreparationGuide,
                    GeneratedAt = session.AIPreparationGeneratedAt ?? DateTime.UtcNow,
                    WasAlreadyGenerated = true
                };
            }

            // Build user prompt with session context
            var userPrompt = BuildPreparationPrompt(session);

            var guide = await _aiClient.GetCompletionAsync(
                SessionPreparationPrompt.SystemPrompt,
                userPrompt);

            session.AIPreparationGuide = guide;
            session.AIPreparationGeneratedAt = DateTime.UtcNow;
            _sessionRepository.Update(session);
            await _sessionRepository.SaveChangesAsync();

            _logger.LogInformation("[Session] AI preparation generated for session {SessionId}", sessionId);

            return new GeneratePreparationResponseDto
            {
                SessionId = sessionId,
                PreparationGuide = guide,
                GeneratedAt = session.AIPreparationGeneratedAt.Value,
                WasAlreadyGenerated = false
            };
        }

        private static string BuildPreparationPrompt(Session session)
        {
            var menteeName = session.Mentee?.FullName ?? "the mentee";
            var topic = session.Topic;
            var notes = session.Notes;
            var duration = session.Duration == DurationOptions.ThirtyMinutes ? "30" : "60";
            var scheduledDate = session.ScheduledStartTime.ToString("MMMM dd, yyyy 'at' HH:mm 'UTC'");

            if (string.IsNullOrWhiteSpace(topic) && string.IsNullOrWhiteSpace(notes))
            {
                return $"""
                    **SESSION INFO:**
                    - Mentee: {menteeName}
                    - Duration: {duration} minutes
                    - Scheduled: {scheduledDate}

                    **NOTE:** The mentee has not provided a topic or notes for this session. 
                    Please provide general preparation guidance and suggest questions to ask at the start of the session to understand their needs.
                    """;
            }

            return $"""
                **SESSION INFO:**
                - Mentee: {menteeName}
                - Duration: {duration} minutes
                - Scheduled: {scheduledDate}

                **TOPIC:** {topic ?? "Not specified"}

                **MENTEE'S NOTES:** {notes ?? "No additional notes provided"}
                """;
        }

        public async Task CancelSessionAsync(string sessionId, string cancellationReason)
        {
            _logger.LogInformation("[Session] Cancelling session {SessionId} with Zoom integration", sessionId);

            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null) throw new NotFoundException("Session", sessionId);

            if (session.Status == SessionStatusOptions.Completed || session.Status == SessionStatusOptions.Cancelled)
            {
                _logger.LogWarning("[Session] Session {SessionId} is already {Status}", sessionId, session.Status);
                return;
            }

            session.Status = SessionStatusOptions.Cancelled;
            session.CancellationReason = cancellationReason;
            session.TimeSlotId = null;

            _sessionRepository.Update(session);
            await _sessionRepository.SaveChangesAsync();

            if (session.ZoomMeetingId.HasValue)
            {
                try
                {
                    await _zoomService.DeleteMeetingAsync(session.ZoomMeetingId.Value, session.Id);
                    _logger.LogInformation("[Session] Deleted Zoom meeting for session {SessionId}", sessionId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[Session] Failed to delete Zoom meeting for session {SessionId}", sessionId);
                }
            }
        }

        public async Task RescheduleSessionAsync(string sessionId, DateTime newStartTime, DateTime newEndTime)
        {
            _logger.LogInformation("[Session] Rescheduling session {SessionId} to {Start} - {End}", sessionId, newStartTime, newEndTime);

            await _rescheduleLock.WaitAsync();
            try
            {
                var session = await _sessionRepository.GetByIdAsync(sessionId);
                if (session == null) throw new NotFoundException("Session", sessionId);

                session.ScheduledStartTime = newStartTime;
                session.ScheduledEndTime = newEndTime;
                session.Status = SessionStatusOptions.Confirmed;
                session.UpdatedAt = DateTime.UtcNow;

                _sessionRepository.Update(session);
                await _sessionRepository.SaveChangesAsync();

                if (session.ZoomMeetingId.HasValue)
                {
                    try
                    {
                        await _zoomService.UpdateMeetingAsync(session.ZoomMeetingId.Value, session.Id, newStartTime, newEndTime);
                        _logger.LogInformation("[Session] Updated Zoom meeting for session {SessionId}", sessionId);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "[Session] Failed to update Zoom meeting for session {SessionId}", sessionId);
                    }
                }

                await SendCalendarInvitationsAsync(session);
            }
            finally
            {
                _rescheduleLock.Release();
            }
        }

        public async Task<VideoLinkDto> GetVideoLinkAsync(string sessionId, string userId)
        {
            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null) throw new NotFoundException("Session", sessionId);

            if (session.MentorId != userId && session.MenteeId != userId)
            {
                throw new UnauthorizedException("You are not authorized to access this session.");
            }

            if (string.IsNullOrEmpty(session.VideoConferenceLink))
            {
                throw new NotFoundException("Video conference link not available");
            }

            return new VideoLinkDto
            {
                JoinUrl = session.VideoConferenceLink,
                Password = session.ZoomMeetingPassword,
                AvailableFrom = session.ScheduledStartTime.AddMinutes(-10),
                AvailableUntil = session.ScheduledEndTime.AddMinutes(30)
            };
        }

        public async Task EndSessionAsync(string sessionId, string userId)
        {
            _logger.LogInformation("[Session] Request to end session {SessionId} by user {UserId}", sessionId, userId);

            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null) throw new NotFoundException("Session", sessionId);

            if (session.MentorId != userId)
            {
                throw new UnauthorizedException("Only the assigned Mentor can end the session.");
            }

            if (!session.ZoomMeetingId.HasValue)
            {
                _logger.LogWarning("[Session] Cannot end session {SessionId}: No active Zoom meeting ID", sessionId);
                throw new BusinessException("No active Zoom meeting found for this session.");
            }

            try
            {
                var success = await _zoomService.EndMeetingAsync(session.ZoomMeetingId.Value, sessionId, $"Ended by Mentor {userId}");

                if (!success)
                {
                    throw new BusinessException("Failed to end the meeting via Zoom. It may have already ended or is invalid.");
                }

                _logger.LogInformation("[Session] Successfully ended Zoom meeting for session {SessionId}", sessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Session] Error while ending session {SessionId}", sessionId);
                throw new BusinessException($"Failed to end session: {ex.Message}");
            }
        }

        public async Task AutoTerminateSessionAsync(string sessionId)
        {
            _logger.LogInformation("[Session] Executing automatic termination check for session {SessionId}", sessionId);

            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null)
            {
                _logger.LogWarning("[Session] Auto-termination failed: Session {SessionId} not found", sessionId);
                return;
            }

            if (session.Status == SessionStatusOptions.Completed || session.Status == SessionStatusOptions.Cancelled)
            {
                _logger.LogInformation("[Session] Auto-termination skipped: Session {SessionId} is already {Status}", sessionId, session.Status);
                return;
            }

            if (DateTime.UtcNow < session.ScheduledEndTime.AddMinutes(2))
            {
                _logger.LogInformation("[Session] Auto-termination skipped: Session {SessionId} is not yet due for termination. ScheduledEndTime: {EndTime}", sessionId, session.ScheduledEndTime);
                return;
            }

            if (!session.ZoomMeetingId.HasValue)
            {
                _logger.LogWarning("[Session] Auto-termination skipped: Session {SessionId} has no Zoom meeting ID", sessionId);
                return;
            }

            try
            {
                var reason = "Automatic termination - Session exceeded scheduled end time";
                var success = await _zoomService.EndMeetingAsync(session.ZoomMeetingId.Value, sessionId, reason);

                if (success)
                {
                    session.Status = SessionStatusOptions.Completed;
                    session.CompletedAt = DateTime.UtcNow;
                    session.UpdatedAt = DateTime.UtcNow;

                    _sessionRepository.Update(session);
                    await _sessionRepository.SaveChangesAsync();

                    _logger.LogInformation("[Session] Successfully auto-terminated session {SessionId}", sessionId);
                }
                else
                {
                    _logger.LogWarning("[Session] Auto-termination: Zoom API reported failure to end meeting for session {SessionId}", sessionId);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Session] Auto-termination failed for session {SessionId}", sessionId);
                throw;
            }
        }

        public async Task ProcessRecordingCompletedAsync(long meetingId, List<ZoomRecordingFileDto> recordingFiles, string? downloadAccessToken = null)
        {
            _logger.LogInformation("[Session] Processing recording completion for Zoom meeting: {MeetingId}", meetingId);

            var sessions = await _sessionRepository.GetAllAsync();
            var session = sessions.FirstOrDefault(s => s.ZoomMeetingId == meetingId);

            if (session == null)
            {
                _logger.LogWarning("[Session] No session found for Zoom meeting ID: {MeetingId}", meetingId);
                return;
            }

            var recordingData = await _zoomService.GetMeetingRecordingsAsync(meetingId, session.Id);
            var apiFiles = recordingData.RecordingFiles ?? new List<ZoomRecordingFileDto>();

            var videoPlayFile = apiFiles.FirstOrDefault(f => f.FileType.Equals("MP4", StringComparison.OrdinalIgnoreCase));
            if (videoPlayFile != null && !string.IsNullOrEmpty(videoPlayFile.PlayUrl))
            {
                session.RecordingPlayUrl = videoPlayFile.PlayUrl;
                session.RecordingAvailableAt = DateTime.UtcNow;
            }

            await ProcessVideoStorageAsync(session, apiFiles, downloadAccessToken);

            bool transcriptProcessed = await ProcessTranscriptionAsync(session);

            if (!transcriptProcessed && !session.TranscriptProcessed)
            {
                _logger.LogInformation("[Session] No transcript generated for session {SessionId}. Initializing retry tracking.", session.Id);
                session.TranscriptProcessed = false;
                session.TranscriptRetrievalAttempts = 1;
                session.LastTranscriptRetrievalAttempt = DateTime.UtcNow;
            }

            session.RecordingProcessed = true;
            session.Status = SessionStatusOptions.Completed;
            session.CompletedAt = DateTime.UtcNow;
            session.UpdatedAt = DateTime.UtcNow;

            _sessionRepository.Update(session);
            await _sessionRepository.SaveChangesAsync();

            _logger.LogInformation("[Session] Successfully processed recording completion for session {SessionId}. Status updated to Completed.", session.Id);
        }

        private async Task ProcessVideoStorageAsync(Session session, List<ZoomRecordingFileDto> files, string? downloadToken)
        {
            var videoFile = files.FirstOrDefault(f => f.FileType.Equals("MP4", StringComparison.OrdinalIgnoreCase));

            if (videoFile == null || string.IsNullOrEmpty(videoFile.DownloadUrl))
            {
                _logger.LogWarning("[Session] No downloadable MP4 file found for session {SessionId}", session.Id);
                return;
            }

            try
            {
                _logger.LogInformation("[Session] Downloading video content for session {SessionId}", session.Id);

                using var videoStream = await _zoomService.DownloadFileStreamAsync(videoFile.DownloadUrl, downloadToken);

                var fileName = $"{session.Id}.mp4";
                var key = await _blobStorageService.UploadAsync(videoStream, fileName, "video/mp4", videoFile.FileSize);

                session.VideoStorageKey = key;

                _logger.LogInformation("[Session] Stored video content in R2 for session {SessionId}, Key: {Key}", session.Id, key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Session] Failed to download/store video content for session {SessionId}", session.Id);
            }
        }

        private async Task<bool> ProcessTranscriptionAsync(Session session)
        {
            if (string.IsNullOrEmpty(session.VideoStorageKey))
            {
                _logger.LogWarning("[Session] No video storage key available for transcription for session {SessionId}", session.Id);
                return false;
            }

            try
            {
                _logger.LogInformation("[Session] Starting Deepgram transcription via R2 URL for session {SessionId}", session.Id);

                var presignedUrl = _blobStorageService.GetPresignedUrl(session.VideoStorageKey, TimeSpan.FromMinutes(60));

                var transcript = await _deepgramService.TranscribeAudioUrlAsync(presignedUrl);

                if (!string.IsNullOrEmpty(transcript))
                {
                    session.Transcript = transcript;
                    session.TranscriptProcessed = true;

                    _logger.LogInformation("[Session] Deepgram transcription successful for session {SessionId}", session.Id);

                    await TriggerAISummaryGenerationEventAsync(session);
                    return true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Session] Failed to generate Deepgram transcript for session {SessionId}", session.Id);
            }

            return false;
        }

        private async Task SendCalendarInvitationsAsync(Session session)
        {
            try
            {
                _logger.LogInformation("[Session] Sending calendar invitations for session {SessionId}", session.Id);

                var mentee = await _userRepository.GetByIdAsync(session.MenteeId);
                var mentor = await _userRepository.GetByIdAsync(session.MentorId);

                if (mentee == null || mentor == null)
                {
                    _logger.LogError("[Session] Cannot send calendar invitations for session {SessionId}: Mentee or Mentor not found", session.Id);
                    return;
                }

                if (string.IsNullOrEmpty(mentee.Email) || string.IsNullOrEmpty(mentor.Email))
                {
                    _logger.LogError("[Session] Cannot send calendar invitations for session {SessionId}: Mentee or Mentor email is missing", session.Id);
                    return;
                }

                var topic = session.Topic ?? $"Mentorship Session - {session.Id}";
                var location = session.VideoConferenceLink ?? "Video Conference Link TBD";
                var description = $"Mentorship Session\n\n" +
                                $"Mentee: {mentee.FullName}\n" +
                                $"Mentor: {mentor.FullName}\n" +
                                $"Duration: {(int)(session.ScheduledEndTime - session.ScheduledStartTime).TotalMinutes} minutes\n\n" +
                                $"Join URL: {location}";

                if (!string.IsNullOrEmpty(session.ZoomMeetingPassword))
                {
                    description += $"\nPassword: {session.ZoomMeetingPassword}";
                }

                var attendeeEmails = new List<string> { mentee.Email, mentor.Email };

                var calendarContent = _calendarService.GenerateCalendarInvitation(
                    session.Id,
                    topic,
                    session.ScheduledStartTime,
                    session.ScheduledEndTime,
                    location,
                    description,
                    attendeeEmails,
                    mentor.Email,
                    mentor.FullName);

                var menteeEmailSubject = $"Updated: {topic}";
                var menteeEmailBody = $"Hello {mentee.FirstName},\n\n" +
                                     $"Your mentorship session has been rescheduled.\n\n" +
                                     $"New Date & Time: {session.ScheduledStartTime:f} UTC\n" +
                                     $"Duration: {(int)(session.ScheduledEndTime - session.ScheduledStartTime).TotalMinutes} minutes\n" +
                                     $"Mentor: {mentor.FullName}\n\n" +
                                     $"Join URL: {location}\n";

                if (!string.IsNullOrEmpty(session.ZoomMeetingPassword))
                {
                    menteeEmailBody += $"Password: {session.ZoomMeetingPassword}\n";
                }

                menteeEmailBody += "\nPlease find the updated calendar invitation attached.\n\n" +
                                  "Best regards,\nCareerRoute Team";

                var menteeEmailHtml = $"<p>Hello {mentee.FirstName},</p>" +
                                     $"<p>Your mentorship session has been rescheduled.</p>" +
                                     $"<p><strong>New Date & Time:</strong> {session.ScheduledStartTime:f} UTC<br>" +
                                     $"<strong>Duration:</strong> {(int)(session.ScheduledEndTime - session.ScheduledStartTime).TotalMinutes} minutes<br>" +
                                     $"<strong>Mentor:</strong> {mentor.FullName}</p>" +
                                     $"<p><strong>Join URL:</strong> <a href=\"{location}\">{location}</a><br>";

                if (!string.IsNullOrEmpty(session.ZoomMeetingPassword))
                {
                    menteeEmailHtml += $"<strong>Password:</strong> {session.ZoomMeetingPassword}<br>";
                }

                menteeEmailHtml += "</p><p>Please find the updated calendar invitation attached.</p>" +
                                  "<p>Best regards,<br>CareerRoute Team</p>";

                await _emailService.SendEmailWithCalendarAsync(
                    mentee.Email,
                    menteeEmailSubject,
                    menteeEmailBody,
                    menteeEmailHtml,
                    calendarContent);

                var mentorEmailSubject = $"Updated: {topic}";
                var mentorEmailBody = $"Hello {mentor.FirstName},\n\n" +
                                     $"Your mentorship session has been rescheduled.\n\n" +
                                     $"New Date & Time: {session.ScheduledStartTime:f} UTC\n" +
                                     $"Duration: {(int)(session.ScheduledEndTime - session.ScheduledStartTime).TotalMinutes} minutes\n" +
                                     $"Mentee: {mentee.FullName}\n\n" +
                                     $"Join URL: {location}\n";

                if (!string.IsNullOrEmpty(session.ZoomMeetingPassword))
                {
                    mentorEmailBody += $"Password: {session.ZoomMeetingPassword}\n";
                }

                mentorEmailBody += "\nPlease find the updated calendar invitation attached.\n\n" +
                                  "Best regards,\nCareerRoute Team";

                var mentorEmailHtml = $"<p>Hello {mentor.FirstName},</p>" +
                                     $"<p>Your mentorship session has been rescheduled.</p>" +
                                     $"<p><strong>New Date & Time:</strong> {session.ScheduledStartTime:f} UTC<br>" +
                                     $"<strong>Duration:</strong> {(int)(session.ScheduledEndTime - session.ScheduledStartTime).TotalMinutes} minutes<br>" +
                                     $"<strong>Mentee:</strong> {mentee.FullName}</p>" +
                                     $"<p><strong>Join URL:</strong> <a href=\"{location}\">{location}</a><br>";

                if (!string.IsNullOrEmpty(session.ZoomMeetingPassword))
                {
                    mentorEmailHtml += $"<strong>Password:</strong> {session.ZoomMeetingPassword}<br>";
                }

                mentorEmailHtml += "</p><p>Please find the updated calendar invitation attached.</p>" +
                                  "<p>Best regards,<br>CareerRoute Team</p>";

                await _emailService.SendEmailWithCalendarAsync(
                    mentor.Email,
                    mentorEmailSubject,
                    mentorEmailBody,
                    mentorEmailHtml,
                    calendarContent);

                _logger.LogInformation("[Session] Successfully sent calendar invitations for session {SessionId}", session.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Session] Failed to send calendar invitations for session {SessionId}. Session was rescheduled successfully.", session.Id);
            }
        }

        private Task TriggerAISummaryGenerationEventAsync(Session session)
        {
            _jobScheduler.EnqueueAsync<IAiSummaryService>(s => s.GenerateAndStoreSummaryAsync(session.Id, default));
            _logger.LogInformation("[Session] AI summary job enqueued for session {SessionId}", session.Id);
            return Task.CompletedTask;
        }

        private async Task SendRescheduleRequestEmailAsync(string receiverEmail, string receiverName, string requesterName, RescheduleSession rescheduleSession, Session session)
        {
            var subject = "Session Reschedule Requested";
            var body = $"Hello {receiverName},\n\n" +
                       $"{requesterName} requested to reschedule the session scheduled at {session.ScheduledStartTime:f} UTC.\n\n" +
                       $"New Proposed Time: {rescheduleSession.NewScheduledStartTime:f} UTC\n\n" +
                       "Please log in to approve or reject this request.\n\n" +
                       "Best regards,\nCareerRoute Team";

            await _emailService.SendEmailAsync(receiverEmail, subject, body, body);
        }

        public async Task SendZoomLinkEmailAsync(string sessionId)
        {
            _logger.LogInformation("[Session] Sending Zoom link email for session {SessionId}", sessionId);

            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null)
            {
                _logger.LogWarning("[Session] Cannot send Zoom link email: Session {SessionId} not found", sessionId);
                return;
            }

            if (session.Status == SessionStatusOptions.Cancelled)
            {
                _logger.LogInformation("[Session] Skipping Zoom link email: Session {SessionId} was cancelled", sessionId);
                return;
            }

            if (string.IsNullOrEmpty(session.VideoConferenceLink))
            {
                _logger.LogWarning("[Session] Cannot send Zoom link email: No video conference link for session {SessionId}", sessionId);
                return;
            }

            try
            {
                var mentee = await _userRepository.GetByIdAsync(session.MenteeId);
                var mentor = await _userRepository.GetByIdAsync(session.MentorId);

                if (mentee == null || mentor == null)
                {
                    _logger.LogError("[Session] Cannot send Zoom link email for session {SessionId}: Mentee or Mentor not found", sessionId);
                    return;
                }

                if (string.IsNullOrEmpty(mentee.Email) || string.IsNullOrEmpty(mentor.Email))
                {
                    _logger.LogError("[Session] Cannot send Zoom link email for session {SessionId}: Missing email addresses", sessionId);
                    return;
                }

                var topic = session.Topic ?? $"Mentorship Session";
                var duration = (int)(session.ScheduledEndTime - session.ScheduledStartTime).TotalMinutes;

                // Send to Mentee
                var menteeSubject = $"Your Session Starts Soon - Join Link Inside";
                var menteeHtmlBody = $@"
                    <p>Hello {mentee.FirstName},</p>
                    <p>Your mentorship session is starting in <strong>15 minutes</strong>!</p>
                    <p><strong>Session Details:</strong></p>
                    <ul>
                        <li><strong>Topic:</strong> {topic}</li>
                        <li><strong>Mentor:</strong> {mentor.FullName}</li>
                        <li><strong>Date & Time:</strong> {session.ScheduledStartTime:f} UTC</li>
                        <li><strong>Duration:</strong> {duration} minutes</li>
                    </ul>
                    <p><strong>Join the Session:</strong></p>
                    <p><a href=""{session.VideoConferenceLink}"" style=""background-color: #2D8CFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;"">Join Zoom Meeting</a></p>
                    <p>Or copy this link: <a href=""{session.VideoConferenceLink}"">{session.VideoConferenceLink}</a></p>
                    {(string.IsNullOrEmpty(session.ZoomMeetingPassword) ? "" : $"<p><strong>Password:</strong> {session.ZoomMeetingPassword}</p>")}
                    <p>Please join a few minutes early to test your audio and video.</p>
                    <p>Best regards,<br>CareerRoute Team</p>";

                var menteeTextBody = $@"Hello {mentee.FirstName},

Your mentorship session is starting in 15 minutes!

Session Details:
- Topic: {topic}
- Mentor: {mentor.FullName}
- Date & Time: {session.ScheduledStartTime:f} UTC
- Duration: {duration} minutes

Join the Session: {session.VideoConferenceLink}
{(string.IsNullOrEmpty(session.ZoomMeetingPassword) ? "" : $"Password: {session.ZoomMeetingPassword}")}

Please join a few minutes early to test your audio and video.

Best regards,
CareerRoute Team";

                await _emailService.SendEmailAsync(mentee.Email, menteeSubject, menteeTextBody, menteeHtmlBody);

                // Send to Mentor
                var mentorSubject = $"Your Session Starts Soon - Join Link Inside";
                var mentorHtmlBody = $@"
                    <p>Hello {mentor.FirstName},</p>
                    <p>Your mentorship session is starting in <strong>15 minutes</strong>!</p>
                    <p><strong>Session Details:</strong></p>
                    <ul>
                        <li><strong>Topic:</strong> {topic}</li>
                        <li><strong>Mentee:</strong> {mentee.FullName}</li>
                        <li><strong>Date & Time:</strong> {session.ScheduledStartTime:f} UTC</li>
                        <li><strong>Duration:</strong> {duration} minutes</li>
                    </ul>
                    <p><strong>Join the Session:</strong></p>
                    <p><a href=""{session.VideoConferenceLink}"" style=""background-color: #2D8CFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;"">Join Zoom Meeting</a></p>
                    <p>Or copy this link: <a href=""{session.VideoConferenceLink}"">{session.VideoConferenceLink}</a></p>
                    {(string.IsNullOrEmpty(session.ZoomMeetingPassword) ? "" : $"<p><strong>Password:</strong> {session.ZoomMeetingPassword}</p>")}
                    <p>Please join a few minutes early to ensure everything is ready.</p>
                    <p>Best regards,<br>CareerRoute Team</p>";

                var mentorTextBody = $@"Hello {mentor.FirstName},

Your mentorship session is starting in 15 minutes!

Session Details:
- Topic: {topic}
- Mentee: {mentee.FullName}
- Date & Time: {session.ScheduledStartTime:f} UTC
- Duration: {duration} minutes

Join the Session: {session.VideoConferenceLink}
{(string.IsNullOrEmpty(session.ZoomMeetingPassword) ? "" : $"Password: {session.ZoomMeetingPassword}")}

Please join a few minutes early to ensure everything is ready.

Best regards,
CareerRoute Team";

                await _emailService.SendEmailAsync(mentor.Email, mentorSubject, mentorTextBody, mentorHtmlBody);

                _logger.LogInformation("[Session] Successfully sent Zoom link emails for session {SessionId}", sessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Session] Failed to send Zoom link emails for session {SessionId}", sessionId);
            }
        }

        public async Task MarkSessionAsInProgressAsync(long meetingId)
        {
            _logger.LogInformation("[Session] Marking session as InProgress for Zoom meeting: {MeetingId}", meetingId);

            var sessions = await _sessionRepository.GetAllAsync();
            var session = sessions.FirstOrDefault(s => s.ZoomMeetingId == meetingId);

            if (session == null)
            {
                _logger.LogWarning("[Session] No session found for Zoom meeting ID: {MeetingId}", meetingId);
                return;
            }

            if (session.Status == SessionStatusOptions.Confirmed)
            {
                session.Status = SessionStatusOptions.InProgress;
                _sessionRepository.Update(session);
                await _sessionRepository.SaveChangesAsync();
                _logger.LogInformation("[Session] Session {SessionId} marked as InProgress", session.Id);
            }
            else
            {
                _logger.LogInformation("[Session] Session {SessionId} status is {Status}, not updating to InProgress", session.Id, session.Status);
            }
        }

        public async Task MarkSessionAsInProgressByIdAsync(string sessionId)
        {
            _logger.LogInformation("[Session] Marking session {SessionId} as InProgress (scheduled job)", sessionId);

            var session = await _sessionRepository.GetByIdAsync(sessionId);
            if (session == null)
            {
                _logger.LogWarning("[Session] Session {SessionId} not found", sessionId);
                return;
            }

            if (session.Status == SessionStatusOptions.Confirmed)
            {
                session.Status = SessionStatusOptions.InProgress;
                _sessionRepository.Update(session);
                await _sessionRepository.SaveChangesAsync();
                _logger.LogInformation("[Session] Session {SessionId} marked as InProgress by scheduled job", sessionId);
            }
            else
            {
                _logger.LogInformation("[Session] Session {SessionId} status is {Status}, not updating to InProgress", sessionId, session.Status);
            }
        }

        #endregion
    }


}

