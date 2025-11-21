using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.Sessions;
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
        Task<SessionDetailsResponseDto> GetSessionDetailsAsync(string sessionId);
        Task<List<UpCommingSessionsResponseDto>> GetUpcomingSessionsAsync();
        Task<List<PastSessionsResponseDto>> GetPastSessionsAsync();
        Task<RescheduleSessionResponseDto> RescheduleSessionAsync(string sessionId, RescheduleSessionRequestDto dto,
                                                                                string userId, string role);


        Task<CancelSessionResponseDto> CancelSessionAsync(string sessionId, CancelSessionRequestDto dto,
                                                                       string userId, string role);

    }
}