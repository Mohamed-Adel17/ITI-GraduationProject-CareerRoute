using CareerRoute.Core.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Domain.Interfaces
{
    public interface IMentorRepository : IBaseRepository<Mentor>
    {
        /// Get a mentor by their user ID, including related User entity.
        /// Use this when you need mentor + user info in one query.
        Task<Mentor?> GetMentorWithUserByIdAsync(string id);

        // Get all approved and verified mentors.
        // Used for public mentor listings and search.
        Task<IEnumerable<Mentor>> GetApprovedMentorsAsync();

        // Get all mentors pending admin approval.
        // Used in admin dashboard to review new applications.
        Task<IEnumerable<Mentor>> GetPendingMentorsAsync();

        // Search mentors by expertise tags or bio keywords.
        // Supports full-text search for better user experience.
        Task<IEnumerable<Mentor>> SearchMentorsAsync(string searchTerm);

        // Get top mentors by average rating.
        // Used for "Featured Mentors" or "Top Rated" sections.
        Task<IEnumerable<Mentor>> GetTopRatedMentorsAsync(int count = 10);

        // Get mentors by category ID (based on their skills).
        // Used for browsing mentors by category.
        Task<IEnumerable<Mentor>> GetMentorsByCategoryAsync(int categoryId);

        // Check if a user is already a mentor.
        // Used to prevent duplicate mentor applications.
        Task<bool> IsMentorAsync(string id);

        // Update mentor's average rating and review count.
        // Called after a new review is submitted.
        Task UpdateRatingAsync(string mentorId, decimal newAverageRating, int totalReviews);

        // Increment the total sessions completed counter.
        // Called after a session is successfully completed.
        Task IncrementSessionCountAsync(string mentorId);
    }
}
