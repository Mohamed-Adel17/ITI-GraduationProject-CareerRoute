using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.Mentors;
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
            return await dbContext.Mentors
                .Include(m => m.User)
                    .ThenInclude(u => u.UserSkills)
                        .ThenInclude(us => us.Skill)
                            .ThenInclude(s => s.Category)
                .Include(m => m.PreviousWorks)
                .Include(m => m.MentorCategories)
                    .ThenInclude(mc => mc.Category)
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<IEnumerable<Mentor>> GetApprovedMentorsAsync()
        {
            return await dbContext.Mentors
                .Include(m => m.User)
                    .ThenInclude(u => u.UserSkills)
                        .ThenInclude(us => us.Skill)
                            .ThenInclude(s => s.Category)
                .Where(m => m.IsVerified && m.ApprovalStatus == MentorApprovalStatus.Approved)
                .ToListAsync();
        }

        public async Task<IEnumerable<Mentor>> GetPendingMentorsAsync()
        {
            return await dbContext.Mentors
                .Include(m => m.User)
                    .ThenInclude(u => u.UserSkills)
                        .ThenInclude(us => us.Skill)
                            .ThenInclude(s => s.Category)
                .Include(m => m.PreviousWorks)
                .Where(m => m.ApprovalStatus == MentorApprovalStatus.Pending)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Mentor>> GetTopRatedMentorsAsync(int count = 10)
        {
            return await dbContext.Mentors
                .Include(m => m.User)
                    .ThenInclude(u => u.UserSkills)
                        .ThenInclude(us => us.Skill)
                            .ThenInclude(s => s.Category)
                .Where(m => m.ApprovalStatus == MentorApprovalStatus.Approved && m.IsVerified && m.TotalReviews > 0)
                .OrderByDescending(m => m.AverageRating)
                .ThenByDescending(m => m.TotalReviews)
                .Take(count)
                .ToListAsync();
        }

        public async Task<IEnumerable<Mentor>> GetMentorsByCategoryAsync(int categoryId)
        {
            return await dbContext.Mentors
                .Include(m => m.User)
                    .ThenInclude(u => u.UserSkills)
                        .ThenInclude(us => us.Skill)
                            .ThenInclude(s => s.Category)
                .Where(m => m.ApprovalStatus == MentorApprovalStatus.Approved 
                         && m.IsVerified 
                         && m.IsAvailable
                         && m.User.UserSkills.Any(us => us.Skill.CategoryId == categoryId && us.Skill.IsActive))
                .OrderByDescending(m => m.AverageRating)
                .ThenByDescending(m => m.TotalReviews)
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
                    .ThenInclude(u => u.UserSkills)
                        .ThenInclude(us => us.Skill)
                            .ThenInclude(s => s.Category)
                .Where(m => m.ApprovalStatus == MentorApprovalStatus.Approved && m.IsVerified &&
                       (EF.Functions.Like(m.Bio, $"%{escapedTerm}%") ||
                        m.User.UserSkills.Any(us => EF.Functions.Like(us.Skill.Name, $"%{escapedTerm}%")) ||
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

        // Advanced search with filters, sorting, and pagination (US2)
        public async Task<IEnumerable<Mentor>> SearchMentorsWithFiltersAsync(MentorSearchRequestDto request)
        {
            var query = BuildSearchQuery(request);

            // Apply sorting
            query = ApplySorting(query, request.SortBy);

            // Apply pagination
            return await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToListAsync();
        }

        // Get total count for search results (for pagination)
        public async Task<int> GetSearchResultsCountAsync(MentorSearchRequestDto request)
        {
            var query = BuildSearchQuery(request);
            return await query.CountAsync();
        }

        // Helper method to build the base search query with all filters
        private IQueryable<Mentor> BuildSearchQuery(MentorSearchRequestDto request)
        {
            // Start with base query including all necessary relationships
            var query = dbContext.Mentors
                .Include(m => m.User)
                    .ThenInclude(u => u.UserSkills)
                        .ThenInclude(us => us.Skill)
                            .ThenInclude(s => s.Category)
                .Include(m => m.PreviousWorks)
                .Include(m => m.MentorCategories)
                    .ThenInclude(mc => mc.Category)
                .AsNoTracking()
                .Where(m => m.ApprovalStatus == MentorApprovalStatus.Approved && m.IsVerified);

            // Apply keyword search (Bio, Certifications, User names, Skills)
            if (!string.IsNullOrWhiteSpace(request.Keywords))
            {
                var escapedTerm = request.Keywords.Trim()
                    .Replace("[", "[[]")
                    .Replace("%", "[%]")
                    .Replace("_", "[_]");

                query = query.Where(m =>
                    EF.Functions.Like(m.Bio, $"%{escapedTerm}%") ||
                    EF.Functions.Like(m.Certifications ?? "", $"%{escapedTerm}%") ||
                    EF.Functions.Like(m.User.FirstName, $"%{escapedTerm}%") ||
                    EF.Functions.Like(m.User.LastName, $"%{escapedTerm}%") ||
                    m.User.UserSkills.Any(us => EF.Functions.Like(us.Skill.Name, $"%{escapedTerm}%")));
            }

            // Apply category filter
            if (request.CategoryId.HasValue)
            {
                query = query.Where(m => m.MentorCategories.Any(mc => mc.CategoryId == request.CategoryId.Value));
            }

            // Apply price range filters
            if (request.MinPrice.HasValue)
            {
                query = query.Where(m => m.Rate30Min >= request.MinPrice.Value);
            }

            if (request.MaxPrice.HasValue)
            {
                query = query.Where(m => m.Rate30Min <= request.MaxPrice.Value);
            }

            // Apply minimum rating filter
            if (request.MinRating.HasValue)
            {
                query = query.Where(m => m.AverageRating >= request.MinRating.Value);
            }

            return query;
        }

        // Helper method to apply sorting
        private IQueryable<Mentor> ApplySorting(IQueryable<Mentor> query, string sortBy)
        {
            return sortBy.ToLower() switch
            {
                "rating" => query
                    .OrderByDescending(m => m.AverageRating)
                    .ThenByDescending(m => m.TotalReviews),
                "priceasc" => query.OrderBy(m => m.Rate30Min),
                "pricedesc" => query.OrderByDescending(m => m.Rate30Min),
                "experience" => query
                    .OrderByDescending(m => m.YearsOfExperience)
                    .ThenByDescending(m => m.AverageRating),
                _ => query
                    .OrderByDescending(m => m.TotalSessionsCompleted)
                    .ThenByDescending(m => m.AverageRating)
            };
        }
    }
}
