using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.Mentors;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Mappings;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Core.Services.Implementations
{
    public class MentorService : IMentorService
    {
        private readonly ILogger<MentorService> _logger;
        private readonly IMapper _mapper;
        private readonly IMentorRepository _mentorRepository;
        private readonly IUserRepository _userRepository;

        public MentorService(
            IMentorRepository mentorRepository,
            IUserRepository userRepository,
            IMapper mapper,
            ILogger<MentorService> logger)
        {
            _mentorRepository = mentorRepository;
            _userRepository = userRepository;
            _mapper = mapper;
            _logger = logger;
        }
        // Get mentor profile by ID
        public async Task<MentorProfileDto?> GetMentorProfileAsync(string mentorId)
        {
            _logger.LogInformation("Fetching mentor profile for ID: {MentorId}", mentorId);

            var mentor = await _mentorRepository.GetByIdAsync(mentorId);
            if (mentor == null)
            {
                _logger.LogWarning("Mentor with ID: {MentorId} not found", mentorId);
                return null;
            }
            return _mapper.Map<MentorProfileDto>(mentor);
        }
        // Get all approved mentors
        public async Task<IEnumerable<MentorProfileDto>> GetAllApprovedMentorsAsync()
        {
            _logger.LogInformation("Fetching all approved mentors");
            var mentors = await _mentorRepository.GetApprovedMentorsAsync();
            return _mapper.Map<IEnumerable<MentorProfileDto>>(mentors);
        }
        // Update mentor profile - only updates provided fields
        public async Task<MentorProfileDto> UpdateMentorProfileAsync(
            string mentorId,
            UpdateMentorProfileDto updatedDto)
        {
            var mentor = await _mentorRepository.GetMentorWithUserByIdAsync(mentorId);
            if(mentor == null)
            {
                _logger.LogError("Mentor with ID: {MentorId} not found", mentorId);
                throw new NotFoundException("Mentor not found");
            }
            // Update only provided fields
            if(updatedDto.Bio != null)
                mentor.Bio = updatedDto.Bio;
            if(updatedDto.ExpertiseTags != null && updatedDto.ExpertiseTags.Any())
                mentor.ExpertiseTags = string.Join(",", updatedDto.ExpertiseTags);
            if(updatedDto.YearsOfExperience.HasValue)
                mentor.YearsOfExperience = updatedDto.YearsOfExperience;
            if(updatedDto.Certifications != null)
                mentor.Certifications = updatedDto.Certifications;
            if(updatedDto.Rate30Min.HasValue)
                mentor.Rate30Min = updatedDto.Rate30Min.Value;
            if(updatedDto.Rate60Min.HasValue)
                mentor.Rate60Min = updatedDto.Rate60Min.Value;
            if(updatedDto.IsAvailable.HasValue)
                mentor.IsAvailable = updatedDto.IsAvailable.Value;

            // TODO: Handle CategoryIds when MentorCategory junction table is implemented
            // if (updateDto.CategoryIds != null && updateDto.CategoryIds.Any())
            //     await UpdateMentorCategories(mentorId, updateDto.CategoryIds);

            mentor.UpdatedAt = DateTime.UtcNow;
            _mentorRepository.Update(mentor);
            await _mentorRepository.SaveChangesAsync();

            _logger.LogInformation("Mentor profile updated successfully for ID: {MentorId}", mentorId);
            
            // Reload to get updated data with user info
            var updatedMentor = await _mentorRepository.GetMentorWithUserByIdAsync(mentorId);
            return _mapper.Map<MentorProfileDto>(updatedMentor!);
        }
        public async Task<MentorProfileDto> CreateMentorProfileAsync(
            string userId,
            CreateMentorProfileDto createdDto)
        {
            _logger.LogInformation("Creating mentor profile for user ID: {UserId}", userId);

            var user = await _userRepository.GetByIdAsync(userId);    
            if(user == null)
            {
                _logger.LogError("User with ID {UserId} not found", userId);
                throw new NotFoundException($"User with ID {userId} not found");
            }
            // Check if user is already a mentor
            if (await _mentorRepository.IsMentorAsync(userId))
            {
                _logger.LogWarning("User {UserId} is already a mentor", userId);
                throw new BusinessException("User has already applied to become a mentor");
            }
            var mentor = new Mentor
            {
                Id = userId, // Same as User ID (one-to-one relationship)
                Bio = createdDto.Bio,
                ExpertiseTags = string.Join(", ", createdDto.ExpertiseTags),
                YearsOfExperience = createdDto.YearsOfExperience,
                Certifications = createdDto.Certifications,
                Rate30Min = createdDto.Rate30Min,  
                Rate60Min = createdDto.Rate60Min, 

                // Default values for new mentors
                ApprovalStatus = "Pending", // Requires admin approval
                IsVerified = false,
                IsAvailable = false,  
                AverageRating = 0,
                TotalReviews = 0,
                TotalSessionsCompleted = 0,
                CreatedAt = DateTime.UtcNow
            };
            await _mentorRepository.AddAsync(mentor);
            await _mentorRepository.SaveChangesAsync();

            // TODO: Handle CategoryIds when MentorCategory junction table is implemented
            // await AssignMentorCategories(userId, createDto.CategoryIds);
            _logger.LogInformation("Mentor profile created successfully for user ID: {UserId}", userId);

            var createdMentor = await _mentorRepository.GetMentorWithUserByIdAsync(userId);

            return _mapper.Map<MentorProfileDto>(createdMentor!);
        }

        // Search mentors by keywords
        public async Task<IEnumerable<MentorProfileDto>> SearchMentorsAsync(string searchTerm)
        {
            _logger.LogInformation("Searching mentors with term : {SearchTerm}", searchTerm);
            var mentors = await _mentorRepository.SearchMentorsAsync(searchTerm);
            return _mapper.Map<IEnumerable<MentorProfileDto>>(mentors);
        }

        // Get top-rated mentors
        public async Task<IEnumerable<MentorProfileDto>> GetTopRatedMentorsAsync(int count = 10)
        {
            _logger.LogInformation("Fetching top {Count} rated mentors", count);
            var mentors = await _mentorRepository.GetTopRatedMentorsAsync(count);
            return _mapper.Map<IEnumerable<MentorProfileDto>>(mentors);
        }

        // ============ ADMIN OPERATIONS ============
        // Get pending mentor applications
        public async Task<IEnumerable<MentorProfileDto>> GetPendingMentorApplicationsAsync()
        {
            _logger.LogInformation("Fetching pending mentor application");
            var mentors = await _mentorRepository.GetPendingMentorsAsync();
            return _mapper.Map<IEnumerable<MentorProfileDto>>(mentors);
        }

        // Approve a mentor application
        public async Task ApproveMentorAsync(string mentorId)
        {
            _logger.LogInformation("Approving mentor ID: {MentorId}", mentorId);

            var mentor = await _mentorRepository.GetMentorWithUserByIdAsync(mentorId);
            if (mentor == null)
            {
                _logger.LogError("Mentor with ID: {MentorID} not found", mentorId);
                throw new NotFoundException($"Mentor with ID {mentorId} not found");
            }
            if(mentor.ApprovalStatus == "Approved")
            {
                _logger.LogWarning("Mentor {MentorId} is already approved", mentorId);
                throw new BusinessException("Mentor is already approved");
            }
            mentor.ApprovalStatus = "Approved";
            mentor.IsVerified = true;
            mentor.IsAvailable = true;
            mentor.UpdatedAt = DateTime.Now;

            _mentorRepository.Update(mentor);
            await _mentorRepository.SaveChangesAsync();
            _logger.LogInformation("Mentor {MentorId} approved successfully", mentorId);

            // TODO: Send approval email to mentor
            // await _emailService.SendMentorApprovalEmailAsync(mentor.User.Email, mentor.User.FirstName);
        }
        // Reject a mentor application
        public async Task RejectMentorAsync(string mentorId, string reason)
        {
            _logger.LogInformation("Rejecting mentor ID: {MentorId}, Reason: {Reason}", mentorId, reason);

            var mentor = await _mentorRepository.GetMentorWithUserByIdAsync(mentorId);

            if (mentor == null)
            {
                _logger.LogError("Mentor with ID {MentorId} not found", mentorId);
                throw new NotFoundException($"Mentor with ID {mentorId} not found");
            }

            mentor.ApprovalStatus = "Rejected";
            mentor.IsAvailable = false;
            mentor.UpdatedAt = DateTime.UtcNow;

            _mentorRepository.Update(mentor);
            await _mentorRepository.SaveChangesAsync();

            _logger.LogInformation("Mentor {MentorId} rejected successfully", mentorId);

            // TODO: Send rejection email with reason
            // await _emailService.SendMentorRejectionEmailAsync(
            //     mentor.User.Email, 
            //     mentor.User.FirstName, 
            //     reason);
        }

        // Check if user is a mentor
        public async Task<bool> IsMentorAsync(string userId)
        {
            return await _mentorRepository.IsMentorAsync(userId);
        }
    }
}
