using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.Sessions;
using CareerRoute.Core.Services.Implementations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Interfaces
{
    public interface ISessionService
    {

        Task<BookSessionResponseDto> BookSessionAsync(string MenteeId, BookSessionRequestDto dto);

        Task<SessionDetailsResponseDto> GetSessionDetailsAsync(string sessionId, string userId, string userRole);
        Task<UpcomingSessionsResponse> GetUpcomingSessionsAsync(string userId, string userRole, int page, int pageSize);
        Task<PastSessionsResponse> GetPastSessionsAsync(string userId, string userRole, int page, int pageSize);

        Task<RescheduleSessionResponseDto> RescheduleSessionAsync(string sessionId, RescheduleSessionRequestDto dto,
                                                                                string userId, string role);

        Task<CancelSessionResponseDto> CancelSessionAsync(string sessionId, CancelSessionRequestDto dto,
                                                                       string userId, string role);
        Task<JoinSessionResponseDto> JoinSessionAsync(string sessionId, string userId);

        Task<CompleteSessionResponseDto> CompleteSessionAsync(string sessionId, string userId, string role);
        Task ReleaseUnpaidSessionAsync(string sessionId);


    }
}