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
       
        Task<BookSessionResponseDto> BookSessionByIdAsync(string MenteeId, BookSessionRequestDto dto);
        Task<SessionDetailsResponseDto> GetSessionDetailsAsync(string sessionId);


    }
}
