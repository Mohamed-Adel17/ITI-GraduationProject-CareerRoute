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
        private readonly ILogger<RescheduleSessionService> _logger;

        public RescheduleSessionService(
            IRescheduleSessionRepository rescheduleRepository,
            ILogger<RescheduleSessionService> logger)
        {
            _rescheduleRepository = rescheduleRepository;
            _logger = logger;
        }

        public async Task HandlePendingRescheduleAsync(string rescheduleRequestId)
        {
            var request = await _rescheduleRepository.GetByIdAsync(rescheduleRequestId);

            if (request.Status == SessionRescheduleOptions.Pending)
            {
                //To Do 

                _rescheduleRepository.Update(request);
                await _rescheduleRepository.SaveChangesAsync();

                _logger.LogInformation("Pending reschedule request {Id} was auto-rejected after 48 hours", rescheduleRequestId);
            }
        }
    }

}
