using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.Mentors;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Mappings;
using CareerRoute.Core.Services.Interfaces;
using FluentValidation;
using CareerRoute.Core.Extentions;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Identity;
using CareerRoute.Core.Constants;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
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
        private readonly IValidator<CreateMentorProfileDto> _createValidator;
        private readonly IValidator<UpdateMentorProfileDto> _updateValidator;
        private readonly IValidator<RejectMentorDto> _rejectValidator;
        private readonly UserManager<ApplicationUser> _userManager;

        public MentorService(
            IMentorRepository mentorRepository,
            IUserRepository userRepository,
            IMapper mapper,
            ILogger<MentorService> logger,
            IValidator<CreateMentorProfileDto> createValidator,
            IValidator<UpdateMentorProfileDto> updateValidator,
            IValidator<RejectMentorDto> rejectValidator,
            UserManager<ApplicationUser> userManager)
        {
            _mentorRepository = mentorRepository;
            _userRepository = userRepository;
            _mapper = mapper;
            _logger = logger;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _rejectValidator = rejectValidator;
            _userManager = userManager;
        }
        
        // Get mentor profile by ID
        public async Task<MentorProfileDto> GetMentorProfileAsync(string mentorId)
        {
            var mentor = await _mentorRepository.GetByIdAsync(mentorId);
            if (mentor == null)
            {
                throw new NotFoundException("Mentor", mentorId);
            }
            return _mapper.Map<MentorProfileDto>(mentor);
        }
        // Get all approved mentors
        public async Task<IEnumerable<MentorProfileDto>> GetAllApprovedMentorsAsync()
        {
            var mentors = await _mentorRepository.GetApprovedMentorsAsync();
            return _mapper.Map<IEnumerable<MentorProfileDto>>(mentors);
        }
        // Update mentor profile - only updates provided fields
        public async Task<MentorProfileDto> UpdateMentorProfileAsync(
            string mentorId,
            UpdateMentorProfileDto updatedDto)
        {
            await _updateValidator.ValidateAndThrowCustomAsync(updatedDto);
            var mentor = await _mentorRepository.GetMentorWithUserByIdAsync(mentorId);
            if(mentor == null)
            {
                throw new NotFoundException("Mentor", mentorId);
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

            // Reload to get updated data with user info
            var updatedMentor = await _mentorRepository.GetMentorWithUserByIdAsync(mentorId);
            return _mapper.Map<MentorProfileDto>(updatedMentor!);
        }
        public async Task<MentorProfileDto> CreateMentorProfileAsync(
            string userId,
            CreateMentorProfileDto createdDto)
        {
            await _createValidator.ValidateAndThrowCustomAsync(createdDto);
            var user = await _userRepository.GetByIdAsync(userId);    
            if(user == null)
            {
                throw new NotFoundException("User", userId);
            }
            
            // Check if user is already a mentor
            // Note: Small race condition exists but mitigated by primary key constraint
            if (await _mentorRepository.IsMentorAsync(userId))
            {
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
            var mentors = await _mentorRepository.SearchMentorsAsync(searchTerm);
            return _mapper.Map<IEnumerable<MentorProfileDto>>(mentors);
        }

        // Get top-rated mentors
        public async Task<IEnumerable<MentorProfileDto>> GetTopRatedMentorsAsync(int count = 10)
        {
            var mentors = await _mentorRepository.GetTopRatedMentorsAsync(count);
            return _mapper.Map<IEnumerable<MentorProfileDto>>(mentors);
        }

        // ============ ADMIN OPERATIONS ============
        // Get pending mentor applications
        public async Task<IEnumerable<MentorProfileDto>> GetPendingMentorApplicationsAsync()
        {
            var mentors = await _mentorRepository.GetPendingMentorsAsync();
            return _mapper.Map<IEnumerable<MentorProfileDto>>(mentors);
        }

        // Approve a mentor application
        public async Task ApproveMentorAsync(string mentorId)
        {
            var mentor = await _mentorRepository.GetMentorWithUserByIdAsync(mentorId);
            if (mentor == null)
            {
                throw new NotFoundException("Mentor", mentorId);
            }
            if(mentor.ApprovalStatus == "Approved")
            {
                throw new BusinessException("Mentor is already approved");
            }
            
            // Update mentor status
            mentor.ApprovalStatus = "Approved";
            mentor.IsVerified = true;
            mentor.IsAvailable = true;
            mentor.UpdatedAt = DateTime.UtcNow;
            
            // Assign Mentor role to user
            var user = mentor.User;
            if (!await _userManager.IsInRoleAsync(user, AppRoles.Mentor))
            {
                var roleResult = await _userManager.AddToRoleAsync(user, AppRoles.Mentor);
                if (!roleResult.Succeeded)
                {
                    throw new BusinessException("Failed to assign Mentor role");
                }
                _logger.LogInformation("Mentor role assigned to user {UserId}", user.Id);
            }

            _mentorRepository.Update(mentor);
            await _mentorRepository.SaveChangesAsync();
            
            _logger.LogInformation("Mentor {MentorId} approved successfully", mentorId);

            // TODO: Send approval email to mentor
            // await _emailService.SendMentorApprovalEmailAsync(mentor.User.Email, mentor.User.FirstName);
        }
        // Reject a mentor application
        public async Task RejectMentorAsync(string mentorId, RejectMentorDto rejectDto)
        {
            await _rejectValidator.ValidateAndThrowCustomAsync(rejectDto);
            var mentor = await _mentorRepository.GetMentorWithUserByIdAsync(mentorId);

            if (mentor == null)
            {
                throw new NotFoundException("Mentor", mentorId);
            }

            mentor.ApprovalStatus = "Rejected";
            mentor.IsAvailable = false;
            mentor.UpdatedAt = DateTime.UtcNow;
            
            // Remove Mentor role if user had it (in case of re-rejection)
            var user = mentor.User;
            if (await _userManager.IsInRoleAsync(user, AppRoles.Mentor))
            {
                var roleResult = await _userManager.RemoveFromRoleAsync(user, AppRoles.Mentor);
                if (!roleResult.Succeeded)
                {
                    _logger.LogWarning("Failed to remove Mentor role from user {UserId}", user.Id);
                }
                else
                {
                    _logger.LogInformation("Mentor role removed from user {UserId}", user.Id);
                }
            }

            _mentorRepository.Update(mentor);
            await _mentorRepository.SaveChangesAsync();

            _logger.LogInformation("Mentor {MentorId} rejected with reason: {Reason}", mentorId, rejectDto.Reason);

            // TODO: Send rejection email with reason
            // await _emailService.SendMentorRejectionEmailAsync(
            //     mentor.User.Email, 
            //     mentor.User.FirstName, 
            //     rejectDto.Reason);
        }

        // Check if user is a mentor
        public async Task<bool> IsMentorAsync(string userId)
        {
            return await _mentorRepository.IsMentorAsync(userId);
        }
    }
}
