using CareerRoute.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Domain.Interfaces
{
    public interface IReviewRepository : IBaseRepository<ReviewSession>
    {
        Task<decimal> GetMentorAverageRatingAsync(string mentorId);
        Task<ReviewSession?> GetByIdWithRelationsAsync(string reviewId);
        Task<(List<ReviewSession> Items, int TotalCount)> GetReviewsForMentorAsync(string mentorId, int page, int pageSize);

    }
}

