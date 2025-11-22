//using CareerRoute.Core.Domain.Interfaces;
//using CareerRoute.Core.Services.Interfaces;
//using CareerRoute.Infrastructure.Repositories;
//using Microsoft.Extensions.Logging;
//using System;
//using System.Collections.Generic;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;

//namespace CareerRoute.Infrastructure.BackgroundJobs
//{
//    public class SessionBackgroundJobs
//    {
//        private readonly ISessionRepository _sessionRepository;
//        private readonly ILogger<SessionBackgroundJobs> _logger;

//        public SessionBackgroundJobs(ISessionRepository sessionRepository, ILogger<SessionBackgroundJobs> logger)
//        {
//            _sessionRepository = sessionRepository;
//            _logger = logger;
//        }

//        //Update HoursUntilSession for sessions starting in the next 24–48 hours

//        public async Task UpdateHoursUntilSessionAsync()
//        {
//            var now = DateTime.UtcNow;

//            // Fetch sessions starting in the next 24-48 hours and are confirmed
//            var sessions = await _sessionRepository
//                .GetSessionsStartingBetweenAsync(now.AddHours(24), now.AddHours(48));

//            foreach (var session in sessions)
//            {
//                session.HoursUntilSession = (int)((session.ScheduledStartTime - now).TotalHours);
//                //_sessionRepository.Update(session); no need it is already tracked 

//            }
            
//            await _sessionRepository.SaveChangesAsync();

//            _logger.LogInformation("{Count} sessions updated for HoursUntilSession at {Time}", sessions.Count, now);



//            //var sessions24h = await _sessionRepository.GetSessionsStartingBetweenAsync(now.AddHours(24), now.AddHours(24).AddMinutes(1));
//            //foreach (var session in sessions24h)
//            //{
//            //    await _emailService.SendAsync(session.MenteeId, $"Reminder: Your session with {session.Mentor.FirstName} is in 24 hours.");
//            //}

//            //// --- 3️⃣ Send 1-hour reminders ---
//            //var sessions1h = await _sessionRepository.GetSessionsStartingBetweenAsync(now.AddHours(1), now.AddHours(1).AddMinutes(1));
//            //foreach (var session in sessions1h)
//            //{
//            //    await _emailService.SendAsync(session.MenteeId, $"Reminder: Your session with {session.Mentor.FirstName} is in 1 hour.");
//            //}

//            //_logger.LogInformation("Session reminders processed at {Time}", now);
//        }
//    }
//}
