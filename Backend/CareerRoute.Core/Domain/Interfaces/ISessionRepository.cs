using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
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

        Task<List<Session>> GetSessionsStartingBetweenAsync(DateTime start, DateTime end); //For Background job 

        Task<(List<Session> Items, int TotalCount)> GetUpcomingSessionsAsync(string userId, string userRole, int page, int pageSize);

        Task<(List<Session> Items, int TotalCount)> GetPastSessionsAsync(string userId, string userRole, int page, int pageSize, SessionStatusOptions? status = null);
        Task<bool> IsMenteeAvailableAsync(string menteeId, DateTime newStart, int durationMinutes);

        Task<Session?> GetByIdForPreparationAsync(string sessionId);
    }
}
