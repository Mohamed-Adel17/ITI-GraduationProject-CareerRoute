using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.Exceptions;
using CareerRoute.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Infrastructure.Repositories
{
    public class MentorRepository : GenericRepository<Mentor>, IMentorRepository
    {
        public MentorRepository(ApplicationDbContext dbContext) :base(dbContext)
        {
        }

        public async Task<Mentor?> GetMentorWithUserByIdAsync(string id)
        {
            return await dbContext.Mentors.Include(m => m.User)
                                   .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<IEnumerable<Mentor>> GetApprovedMentorsAsync()
        {
            return await dbContext.Mentors
                .Include(m => m.User)
                .Where(m => m.IsVerified && m.ApprovalStatus == MentorApprovalStatus.Approved)
                .ToListAsync();
        }

        public async Task<IEnumerable<Mentor>> GetPendingMentorsAsync()
        {
            return await dbContext.Mentors
                .Include(m => m.User)
                .Where(m => m.ApprovalStatus == MentorApprovalStatus.Pending)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Mentor>> GetTopRatedMentorsAsync(int count = 10)
        {
            return await dbContext.Mentors
                .Include(m => m.User)
                .Where(m => m.ApprovalStatus == MentorApprovalStatus.Approved && m.IsVerified && m.TotalReviews > 0)
                .OrderByDescending(m => m.AverageRating)
                .ThenByDescending(m => m.TotalReviews)
                .Take(count)
                .ToListAsync();
        }

        public async Task IncrementSessionCountAsync(string mentorId)
        {
            var mentor = await dbContext.Mentors.FindAsync(mentorId);
            if (mentor == null)
            {
                throw new NotFoundException("Mentor", mentorId);
            }
            mentor.TotalSessionsCompleted++;
            mentor.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync();
        }

        public async Task<bool> IsMentorAsync(string id)
        {
            return await dbContext.Mentors.AnyAsync(m => m.Id == id);
        }

        public async Task<IEnumerable<Mentor>> SearchMentorsAsync(string searchTerm)
        {
            if(string.IsNullOrWhiteSpace(searchTerm))
            {
                return await GetApprovedMentorsAsync();
            }

            // Escape SQL LIKE wildcards to prevent SQL wildcard injection
            var escapedTerm = searchTerm
                .Replace("[", "[[]")
                .Replace("%", "[%]")
                .Replace("_", "[_]");

            return await dbContext.Mentors
                .Include(m => m.User)
                .Where(m => m.ApprovalStatus == MentorApprovalStatus.Approved && m.IsVerified &&
                       (EF.Functions.Like(m.Bio, $"%{escapedTerm}%") ||
                        EF.Functions.Like(m.ExpertiseTags, $"%{escapedTerm}%") ||
                        EF.Functions.Like(m.User.FirstName, $"%{escapedTerm}%") ||
                        EF.Functions.Like(m.User.LastName, $"%{escapedTerm}%")))
                .OrderByDescending(m => m.AverageRating)
                .ToListAsync();
        }

        public async Task UpdateRatingAsync(string mentorId, decimal newAverageRating, int totalReviews)
        {
            if(newAverageRating < 0 || newAverageRating > 5)
            {
                throw new ValidationException(new Dictionary<string, string[]>
                {
                    ["AverageRating"] = new[] { "Average rating must be between 0 and 5" }
                });
            }
            var mentor =  await dbContext.Mentors.FindAsync(mentorId);
            if (mentor == null)
            {
                throw new NotFoundException("Mentor", mentorId);
            }
            mentor.AverageRating = newAverageRating;
            mentor.TotalReviews = totalReviews;
            mentor.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync();
        }
    }
}
