using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Implementations
{
    public class RescheduleSessionService : IRescheduleSessionService
    {
        private readonly IRescheduleSessionRepository _rescheduleRepository;
        private readonly ISessionRepository _sessionRepository;
        private readonly ILogger<RescheduleSessionService> _logger;

        public RescheduleSessionService(
            IRescheduleSessionRepository rescheduleRepository,
            ISessionRepository sessionRepository,
            ILogger<RescheduleSessionService> logger)
        {
            _rescheduleRepository = rescheduleRepository;
            _sessionRepository = sessionRepository;
            _logger = logger;
        }

        public async Task HandlePendingRescheduleAsync(string rescheduleRequestId)
        {
            var request = await _rescheduleRepository.GetByIdAsync(rescheduleRequestId);

            if (request != null && request.Status == SessionRescheduleOptions.Pending)
            {
                request.Status = SessionRescheduleOptions.Rejected;
                _rescheduleRepository.Update(request);
                await _rescheduleRepository.SaveChangesAsync();

                var session = await _sessionRepository.GetByIdAsync(request.SessionId);
                if (session != null)
                {
                    // Revert session status to Confirmed (assuming it was confirmed before reschedule)
                    // If we want to be more precise, we might need to store previous status, 
                    // but typically you reschedule a confirmed session.
                    session.Status = SessionStatusOptions.Confirmed;
                    _sessionRepository.Update(session);
                    await _sessionRepository.SaveChangesAsync();
                }

                _logger.LogInformation("Pending reschedule request {Id} was auto-rejected after timeout", rescheduleRequestId);
            }
        }
    }

}
