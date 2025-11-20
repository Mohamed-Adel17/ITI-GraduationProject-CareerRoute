using CareerRoute.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Domain.Interfaces
{
    public interface ISessionRepository : IBaseRepository<Session>
    {


        Task<bool> HasOverlappingSession(string menteeId, DateTime start, DateTime end);

        Task <Session?> GetByIdWithRelationsAsync(string sessionId);

        Task<List<Session>> GetUpcomingSessionsAsync();
        Task<List<Session>> GetPastSessionsAsync();
        public Task<bool> IsMentorSessionAvailableAsync(string mentorId, DateTime newStart, int durationMinutes);
        public Task<bool> IsMenteeAvailableAsync(string menteeId, DateTime newStart, int durationMinutes);



    }
}
