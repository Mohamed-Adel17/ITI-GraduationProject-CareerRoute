using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.DTOs.Reviews;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Interfaces
{
    public interface IReviewService
    {
        Task<CreateReviewResponseDto> AddReviewAsync(string sessionId, string menteeId, CreateReviewRequestDto dto);

        Task<MentorReviewsDto> GetReviewsForMentorAsync(string mentorId, int page, int pageSize);


    }
}
