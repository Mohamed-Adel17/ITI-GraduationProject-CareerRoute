using CareerRoute.Core.Domain.Entities;
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
        private readonly ApplicationDbContext _context;
        public MentorRepository(ApplicationDbContext context):base(context)
        {
            _context = context;
        }

        public async Task<Mentor?> GetMentorWithUserByIdAsync(string id)
        {
            return await _context.Mentors.Include(m => m.User)
                                   .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<IEnumerable<Mentor>> GetApprovedMentorsAsync()
        {
            return await _context.Mentors
                .Include(m => m.User)
                .Where(m => m.IsVerified && m.ApprovalStatus == "Approved")
                .ToListAsync();
        }

        public async Task<IEnumerable<Mentor>> GetPendingMentorsAsync()
        {
            return await _context.Mentors
                .Include(m => m.User)
                .Where(m => m.ApprovalStatus == "Pending")
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Mentor>> GetTopRatedMentorsAsync(int count = 10)
        {
            return await _context.Mentors
                .Include(m => m.User)
                .Where(m => m.ApprovalStatus == "Approved" && m.IsVerified && m.TotalReviews > 0)
                .OrderByDescending(m => m.AverageRating)
                .ThenByDescending(m => m.TotalReviews)
                .Take(count)
                .ToListAsync();
        }

        public async Task IncrementSessionCountAsync(string mentorId)
        {
            var mentor = await _context.Mentors.FindAsync(mentorId);
            if (mentor == null)
            {
                throw new NotFoundException("Mentor", mentorId);
            }
            mentor.TotalSessionsCompleted++;
            mentor.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task<bool> IsMentorAsync(string id)
        {
            return await _context.Mentors.AnyAsync(m => m.Id == id);
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

            return await _context.Mentors
                .Include(m => m.User)
                .Where(m => m.ApprovalStatus == "Approved" && m.IsVerified &&
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
                throw new ValidationExceptionCustom(new Dictionary<string, string[]>
                {
                    ["AverageRating"] = new[] { "Average rating must be between 0 and 5" }
                });
            }
            var mentor =  await _context.Mentors.FindAsync(mentorId);
            if (mentor == null)
            {
                throw new NotFoundException("Mentor", mentorId);
            }
            mentor.AverageRating = newAverageRating;
            mentor.TotalReviews = totalReviews;
            mentor.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }
}
