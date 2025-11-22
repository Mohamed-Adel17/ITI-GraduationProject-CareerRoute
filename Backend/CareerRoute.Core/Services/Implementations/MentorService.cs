using AutoMapper;
using CareerRoute.Core.Constants;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs;
using CareerRoute.Core.DTOs.Mentors;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Extentions;
using CareerRoute.Core.Mappings;
using CareerRoute.Core.Services.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
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
        private readonly ISkillService _skillService;
        private readonly ICategoryRepository _categoryRepository;
        private readonly IValidator<CreateMentorProfileDto> _createValidator;
        private readonly IValidator<UpdateMentorProfileDto> _updateValidator;
        private readonly IValidator<RejectMentorDto> _rejectValidator;
        private readonly UserManager<ApplicationUser> _userManager;

        public MentorService(
            IMentorRepository mentorRepository,
            IUserRepository userRepository,
            ISkillService skillService,
            ICategoryRepository categoryRepository,
            IMapper mapper,
            ILogger<MentorService> logger,
            IValidator<CreateMentorProfileDto> createValidator,
            IValidator<UpdateMentorProfileDto> updateValidator,
            IValidator<RejectMentorDto> rejectValidator,
            UserManager<ApplicationUser> userManager)
        {
            _mentorRepository = mentorRepository;
            _userRepository = userRepository;
            _skillService = skillService;
            _categoryRepository = categoryRepository;
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
            var mentor = await _mentorRepository.GetMentorWithUserByIdAsync(mentorId);
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
            
            // Handle ExpertiseTagIds - Update UserSkills junction table
            if(updatedDto.ExpertiseTagIds != null)
            {
                // Validate skill IDs
                var isValid = await _skillService.ValidateSkillIdsAsync(updatedDto.ExpertiseTagIds);
                if (!isValid)
                {
                    throw new Exceptions.ValidationException(new Dictionary<string, string[]>
                    {
                        ["ExpertiseTagIds"] = new[] { "One or more skill IDs are invalid or inactive" }
                    });
                }

                // Remove existing UserSkills for this mentor's UserId
                var existingSkills = mentor.User.UserSkills.ToList();
                foreach (var userSkill in existingSkills)
                {
                    mentor.User.UserSkills.Remove(userSkill);
                }

                // Add new UserSkills
                foreach (var skillId in updatedDto.ExpertiseTagIds)
                {
                    mentor.User.UserSkills.Add(new UserSkill
                    {
                        UserId = mentor.Id,
                        SkillId = skillId,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
            
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

            // Update mentor categories if provided
            if (updatedDto.CategoryIds != null)
            {
                // Validate category IDs
                if (updatedDto.CategoryIds.Any())
                {
                    var validCategories = await _categoryRepository.GetAllActiveAsync();
                    var validCategoryIds = validCategories.Select(c => c.Id).ToList();
                    var invalidIds = updatedDto.CategoryIds.Except(validCategoryIds).ToList();
                    
                    if (invalidIds.Any())
                    {
                        throw new Exceptions.ValidationException(new Dictionary<string, string[]>
                        {
                            ["CategoryIds"] = new[] { $"One or more category IDs are invalid or inactive: {string.Join(", ", invalidIds)}" }
                        });
                    }
                }
                
                // Remove existing categories
                var existingCategories = mentor.MentorCategories.ToList();
                foreach (var mentorCategory in existingCategories)
                {
                    mentor.MentorCategories.Remove(mentorCategory);
                }
                
                // Add new categories
                foreach (var categoryId in updatedDto.CategoryIds)
                {
                    mentor.MentorCategories.Add(new MentorCategory
                    {
                        MentorId = mentorId,
                        CategoryId = categoryId
                    });
                }
            }

            // Update User-related fields if provided
            if (updatedDto.FirstName != null)
                mentor.User.FirstName = updatedDto.FirstName;
                
            if (updatedDto.LastName != null)
                mentor.User.LastName = updatedDto.LastName;
                
            if (updatedDto.PhoneNumber != null)
                mentor.User.PhoneNumber = updatedDto.PhoneNumber;
                
            if (updatedDto.ProfilePictureUrl != null)
                mentor.User.ProfilePictureUrl = updatedDto.ProfilePictureUrl;

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
            
            // Validate skill IDs if provided (expertise can be added after approval)
            if (createdDto.ExpertiseTagIds != null && createdDto.ExpertiseTagIds.Any())
            {
                var isValid = await _skillService.ValidateSkillIdsAsync(createdDto.ExpertiseTagIds);
                if (!isValid)
                {
                    throw new Exceptions.ValidationException(new Dictionary<string, string[]>
                    {
                        ["ExpertiseTagIds"] = new[] { "One or more skill IDs are invalid or inactive" }
                    });
                }
            }

            // Set IsMentor flag if not already set
            if (!user.IsMentor)
            {
                user.IsMentor = true;
                var userUpdateResult = await _userManager.UpdateAsync(user);
                if (!userUpdateResult.Succeeded)
                {
                    var errors = string.Join(", ", userUpdateResult.Errors.Select(e => e.Description));
                    throw new BusinessException($"Failed to update user IsMentor flag: {errors}");
                }
                _logger.LogInformation("IsMentor flag set to true for user {UserId} during mentor application", userId);
            }

            var mentor = new Mentor
            {
                Id = userId, // Same as User ID (one-to-one relationship)
                Bio = createdDto.Bio,
                YearsOfExperience = createdDto.YearsOfExperience,
                Certifications = createdDto.Certifications,
                Rate30Min = createdDto.Rate30Min,  
                Rate60Min = createdDto.Rate60Min, 

                // Default values for new mentors
                ApprovalStatus = MentorApprovalStatus.Pending, // Requires admin approval
                IsVerified = false,
                IsAvailable = false,  
                AverageRating = 0,
                TotalReviews = 0,
                TotalSessionsCompleted = 0,
                CreatedAt = DateTime.UtcNow
            };
            
            await _mentorRepository.AddAsync(mentor);
            await _mentorRepository.SaveChangesAsync();

            // Add UserSkills for expertise tags if provided
            if (createdDto.ExpertiseTagIds != null && createdDto.ExpertiseTagIds.Any())
            {
                foreach (var skillId in createdDto.ExpertiseTagIds)
                {
                    user.UserSkills.Add(new UserSkill
                    {
                        UserId = userId,
                        SkillId = skillId,
                        CreatedAt = DateTime.UtcNow
                    });
                }
                await _userRepository.SaveChangesAsync();
            }

            // Assign categories to mentor if provided
            if (createdDto.CategoryIds != null && createdDto.CategoryIds.Any())
            {
                // Validate category IDs
                var validCategories = await _categoryRepository.GetAllActiveAsync();
                var validCategoryIds = validCategories.Select(c => c.Id).ToList();
                var invalidIds = createdDto.CategoryIds.Except(validCategoryIds).ToList();
                
                if (invalidIds.Any())
                {
                    throw new Exceptions.ValidationException(new Dictionary<string, string[]>
                    {
                        ["CategoryIds"] = new[] { $"One or more category IDs are invalid or inactive: {string.Join(", ", invalidIds)}" }
                    });
                }
                
                foreach (var categoryId in createdDto.CategoryIds)
                {
                    mentor.MentorCategories.Add(new MentorCategory
                    {
                        MentorId = userId,
                        CategoryId = categoryId
                    });
                }
                await _mentorRepository.SaveChangesAsync();
            }
            
            _logger.LogInformation("Mentor profile created successfully for user ID: {UserId}", userId);

            var createdMentor = await _mentorRepository.GetMentorWithUserByIdAsync(userId);

            return _mapper.Map<MentorProfileDto>(createdMentor!);
        }

        // Search mentors by keywords - simple search
        public async Task<IEnumerable<MentorProfileDto>> SearchMentorsAsync(string searchTerm)
        {
            var mentors = await _mentorRepository.SearchMentorsAsync(searchTerm);
            return _mapper.Map<IEnumerable<MentorProfileDto>>(mentors);
        }

        // Advanced search with filters, sorting, and pagination (US2)
        public async Task<MentorSearchResponseDto> SearchMentorsAsync(MentorSearchRequestDto request)
        {
            var mentors = await _mentorRepository.SearchMentorsWithFiltersAsync(request);
            var totalCount = await _mentorRepository.GetSearchResultsCountAsync(request);

            var mentorDtos = _mapper.Map<List<MentorProfileDto>>(mentors);

            var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

            return new MentorSearchResponseDto
            {
                Mentors = mentorDtos,
                Pagination = new PaginationMetadataDto
                {
                    TotalCount = totalCount,
                    CurrentPage = request.Page,
                    PageSize = request.PageSize,
                    TotalPages = totalPages,
                    HasNextPage = request.Page < totalPages,
                    HasPreviousPage = request.Page > 1
                },
                AppliedFilters = new AppliedFiltersDto
                {
                    Keywords = request.Keywords,
                    CategoryId = request.CategoryId,
                    MinPrice = request.MinPrice,
                    MaxPrice = request.MaxPrice,
                    MinRating = request.MinRating,
                    SortBy = request.SortBy
                }
            };
        }

        // Get top-rated mentors
        public async Task<IEnumerable<MentorProfileDto>> GetTopRatedMentorsAsync(int count = 10)
        {
            var mentors = await _mentorRepository.GetTopRatedMentorsAsync(count);
            return _mapper.Map<IEnumerable<MentorProfileDto>>(mentors);
        }

        // Get mentors by category
        public async Task<IEnumerable<MentorProfileDto>> GetMentorsByCategoryAsync(int categoryId)
        {
            var mentors = await _mentorRepository.GetMentorsByCategoryAsync(categoryId);
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
            if(mentor.ApprovalStatus == MentorApprovalStatus.Approved)
            {
                throw new BusinessException("Mentor is already approved");
            }
            
            // Update mentor status
            mentor.ApprovalStatus = MentorApprovalStatus.Approved;
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

            // Ensure IsMentor flag is set (should already be true from registration or application)
            if (!user.IsMentor)
            {
                user.IsMentor = true;
                var userUpdateResult = await _userManager.UpdateAsync(user);
                if (!userUpdateResult.Succeeded)
                {
                    var errors = string.Join(", ", userUpdateResult.Errors.Select(e => e.Description));
                    throw new BusinessException($"Failed to update user IsMentor flag: {errors}");
                }
                _logger.LogWarning("IsMentor flag was not set for user {UserId}, set during approval", user.Id);
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

            var user = mentor.User;
            
            // Remove Mentor role if user had it
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

            // Keep IsMentor flag as true to allow reapplication

            // Delete the mentor record
            _mentorRepository.Delete(mentor);
            await _mentorRepository.SaveChangesAsync();

            _logger.LogInformation("Mentor {MentorId} rejected and record deleted. Reason: {Reason}", mentorId, rejectDto.Reason);

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
