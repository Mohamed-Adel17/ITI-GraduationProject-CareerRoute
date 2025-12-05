using AutoMapper;
using CareerRoute.Core.Constants;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs;
using CareerRoute.Core.DTOs.Mentors;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Extentions;
using CareerRoute.Core.Services.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace CareerRoute.Core.Services.Implementations
{
    public class MentorService : IMentorService
    {
        private readonly ILogger<MentorService> _logger;
        private readonly IMapper _mapper;
        private readonly IMentorRepository _mentorRepository;
        private readonly IUserRepository _userRepository;
        private readonly ISkillService _skillService;
        private readonly IMentorBalanceService _mentorBalanceService;
        private readonly ICategoryRepository _categoryRepository;
        private readonly IValidator<CreateMentorProfileDto> _createValidator;
        private readonly IValidator<UpdateMentorProfileDto> _updateValidator;
        private readonly IValidator<RejectMentorDto> _rejectValidator;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ICacheService _cache;
        private readonly ISignalRNotificationService _notificationService;
        private readonly IBlobStorageService _blobStorageService;
        private const string MentorsCacheKey = "Mentors";
        private const string MentorsVersionKey = "MentorsVersion";

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
            UserManager<ApplicationUser> userManager,
            ICacheService cache,
            ISignalRNotificationService notificationService,
            IMentorBalanceService mentorBalanceService,
            IBlobStorageService blobStorageService)
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
            _cache = cache;
            _notificationService = notificationService;
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

        public async Task<IEnumerable<MentorProfileDto>> GetAllApprovedMentorsAsync()
        {
            var version = await _cache.GetAsync<int>(MentorsVersionKey);
            if (version == 0)
            {
                version = 1;
                await _cache.SetAsync(MentorsVersionKey, version);
            }

            string cacheKey = $"{MentorsCacheKey}_Approved_v{version}";

            var cachedMentors = await _cache.GetAsync<IEnumerable<MentorProfileDto>>(cacheKey);
            if (cachedMentors != null)
            {
                _logger.LogInformation("Fetching approved mentors from cache");
                return cachedMentors;
            }

            _logger.LogInformation("Fetching approved mentors from database");
            var mentors = await _mentorRepository.GetApprovedMentorsAsync();
            var mentorDtos = _mapper.Map<IEnumerable<MentorProfileDto>>(mentors);

            await _cache.SetAsync(cacheKey, mentorDtos, TimeSpan.FromMinutes(15), TimeSpan.FromHours(1));

            return mentorDtos;
        }

        public async Task<MentorProfileDto> UpdateMentorProfileAsync(
            string mentorId,
            UpdateMentorProfileDto updatedDto)
        {
            await _updateValidator.ValidateAndThrowCustomAsync(updatedDto);
            var mentor = await _mentorRepository.GetMentorWithUserByIdAsync(mentorId);
            if (mentor == null)
            {
                throw new NotFoundException("Mentor", mentorId);
            }

            if (updatedDto.Bio != null)
                mentor.Bio = updatedDto.Bio;

            if (updatedDto.ExpertiseTagIds != null)
            {
                var isValid = await _skillService.ValidateSkillIdsAsync(updatedDto.ExpertiseTagIds);
                if (!isValid)
                {
                    throw new Exceptions.ValidationException(new Dictionary<string, string[]>
                    {
                        ["ExpertiseTagIds"] = new[] { "One or more skill IDs are invalid or inactive" }
                    });
                }

                var existingSkillIds = mentor.User.UserSkills.Select(us => us.SkillId).ToList();
                var newSkillIds = updatedDto.ExpertiseTagIds.ToList();

                var skillsToRemove = mentor.User.UserSkills.Where(us => !newSkillIds.Contains(us.SkillId)).ToList();
                foreach (var userSkill in skillsToRemove)
                    mentor.User.UserSkills.Remove(userSkill);

                foreach (var skillId in newSkillIds.Except(existingSkillIds))
                {
                    mentor.User.UserSkills.Add(new UserSkill
                    {
                        UserId = mentor.Id,
                        SkillId = skillId,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            if (updatedDto.YearsOfExperience.HasValue)
                mentor.YearsOfExperience = updatedDto.YearsOfExperience;
            if (updatedDto.Certifications != null)
                mentor.Certifications = updatedDto.Certifications;
            if (updatedDto.Rate30Min.HasValue)
                mentor.Rate30Min = updatedDto.Rate30Min.Value;
            if (updatedDto.Rate60Min.HasValue)
                mentor.Rate60Min = updatedDto.Rate60Min.Value;
            if (updatedDto.IsAvailable.HasValue)
                mentor.IsAvailable = updatedDto.IsAvailable.Value;

            if (updatedDto.CategoryIds != null)
            {
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

                var existingCategoryIds = mentor.MentorCategories.Select(mc => mc.CategoryId).ToList();
                var newCategoryIds = updatedDto.CategoryIds.ToList();

                var categoriesToRemove = mentor.MentorCategories.Where(mc => !newCategoryIds.Contains(mc.CategoryId)).ToList();
                foreach (var mentorCategory in categoriesToRemove)
                    mentor.MentorCategories.Remove(mentorCategory);

                foreach (var categoryId in newCategoryIds.Except(existingCategoryIds))
                {
                    mentor.MentorCategories.Add(new MentorCategory
                    {
                        MentorId = mentorId,
                        CategoryId = categoryId
                    });
                }
            }

            if (updatedDto.FirstName != null)
                mentor.User.FirstName = updatedDto.FirstName;

            if (updatedDto.LastName != null)
                mentor.User.LastName = updatedDto.LastName;

            if (updatedDto.PhoneNumber != null)
                mentor.User.PhoneNumber = updatedDto.PhoneNumber;

            // Handle profile picture upload
            if (updatedDto.ProfilePicture != null)
            {
                if (!string.IsNullOrEmpty(mentor.User.ProfilePictureUrl))
                {
                    try { await _blobStorageService.DeleteAsync(mentor.User.ProfilePictureUrl); }
                    catch { /* Ignore deletion errors */ }
                }

                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(updatedDto.ProfilePicture.FileName)}";
                using var stream = updatedDto.ProfilePicture.OpenReadStream();
                var storageKey = await _blobStorageService.UploadAsync(
                    stream, fileName, updatedDto.ProfilePicture.ContentType,
                    FileType.ProfilePicture, updatedDto.ProfilePicture.Length);
                mentor.User.ProfilePictureStorageKey = storageKey;
                mentor.User.ProfilePictureUrl = await _blobStorageService.GetPresignedUrlAsync(storageKey);
                mentor.User.ProfilePictureUrlExpiry = DateTime.UtcNow.AddDays(7);
            }
            
            // Handle CV upload
            if (updatedDto.Cv != null)
            {
                if (!string.IsNullOrEmpty(mentor.CvStorageKey))
                {
                    try { await _blobStorageService.DeleteAsync(mentor.CvStorageKey); }
                    catch { /* Ignore deletion errors */ }
                }

                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(updatedDto.Cv.FileName)}";
                using var stream = updatedDto.Cv.OpenReadStream();
                var storageKey = await _blobStorageService.UploadAsync(
                    stream, fileName, updatedDto.Cv.ContentType,
                    FileType.CV, updatedDto.Cv.Length);
                mentor.CvStorageKey = storageKey;
                mentor.CvUrl = await _blobStorageService.GetPresignedUrlAsync(storageKey);
                mentor.CvUrlExpiry = DateTime.UtcNow.AddDays(7);
            }

            mentor.UpdatedAt = DateTime.UtcNow;
            _mentorRepository.Update(mentor);
            await _mentorRepository.SaveChangesAsync();

            var updatedMentor = await _mentorRepository.GetMentorWithUserByIdAsync(mentorId);

            await InvalidateMentorsCacheAsync();

            return _mapper.Map<MentorProfileDto>(updatedMentor!);
        }

        public async Task<MentorProfileDto> CreateMentorProfileAsync(
            string userId,
            CreateMentorProfileDto createdDto)
        {
            await _createValidator.ValidateAndThrowCustomAsync(createdDto);
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new NotFoundException("User", userId);
            }

            if (await _mentorRepository.IsMentorAsync(userId))
            {
                throw new BusinessException("User has already applied to become a mentor");
            }

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
                Id = userId,
                Bio = createdDto.Bio,
                YearsOfExperience = createdDto.YearsOfExperience,
                Certifications = createdDto.Certifications,
                Rate30Min = createdDto.Rate30Min,
                Rate60Min = createdDto.Rate60Min,
                ApprovalStatus = MentorApprovalStatus.Pending,
                IsVerified = false,
                IsAvailable = false,
                AverageRating = 0,
                TotalReviews = 0,
                TotalSessionsCompleted = 0,
                CreatedAt = DateTime.UtcNow
            };

            // Handle CV upload
            if (createdDto.Cv != null)
            {
                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(createdDto.Cv.FileName)}";
                using var stream = createdDto.Cv.OpenReadStream();
                var storageKey = await _blobStorageService.UploadAsync(
                    stream, fileName, createdDto.Cv.ContentType,
                    FileType.CV, createdDto.Cv.Length);
                mentor.CvStorageKey = storageKey;
                mentor.CvUrl = await _blobStorageService.GetPresignedUrlAsync(storageKey);
                mentor.CvUrlExpiry = DateTime.UtcNow.AddDays(7);
            }

            await _mentorRepository.AddAsync(mentor);
            await _mentorRepository.SaveChangesAsync();

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

            if (createdDto.CategoryIds != null && createdDto.CategoryIds.Any())
            {
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

            await _mentorBalanceService.InitializeMentorBalanceAsync(userId);

            var createdMentor = await _mentorRepository.GetMentorWithUserByIdAsync(userId);

            await InvalidateMentorsCacheAsync();

            return _mapper.Map<MentorProfileDto>(createdMentor!);
        }

        public async Task<IEnumerable<MentorProfileDto>> SearchMentorsAsync(string searchTerm)
        {
            var mentors = await _mentorRepository.SearchMentorsAsync(searchTerm);
            return _mapper.Map<IEnumerable<MentorProfileDto>>(mentors);
        }

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

        public async Task<IEnumerable<MentorProfileDto>> GetTopRatedMentorsAsync(int count = 10)
        {
            var version = await _cache.GetAsync<int>(MentorsVersionKey);
            if (version == 0)
            {
                version = 1;
                await _cache.SetAsync(MentorsVersionKey, version);
            }

            string cacheKey = $"{MentorsCacheKey}_TopRated_{count}_v{version}";

            var cachedMentors = await _cache.GetAsync<IEnumerable<MentorProfileDto>>(cacheKey);
            if (cachedMentors != null)
            {
                _logger.LogInformation("Fetching top-rated mentors from cache");
                return cachedMentors;
            }

            var mentors = await _mentorRepository.GetTopRatedMentorsAsync(count);
            var mentorDtos = _mapper.Map<IEnumerable<MentorProfileDto>>(mentors);

            await _cache.SetAsync(cacheKey, mentorDtos, TimeSpan.FromMinutes(15), TimeSpan.FromHours(1));

            return mentorDtos;
        }

        public async Task<IEnumerable<MentorProfileDto>> GetMentorsByCategoryAsync(int categoryId)
        {
            var version = await _cache.GetAsync<int>(MentorsVersionKey);
            if (version == 0)
            {
                version = 1;
                await _cache.SetAsync(MentorsVersionKey, version);
            }

            string cacheKey = $"{MentorsCacheKey}_Category_{categoryId}_v{version}";

            var cachedMentors = await _cache.GetAsync<IEnumerable<MentorProfileDto>>(cacheKey);
            if (cachedMentors != null)
            {
                _logger.LogInformation("Fetching mentors by category from cache");
                return cachedMentors;
            }

            var mentors = await _mentorRepository.GetMentorsByCategoryAsync(categoryId);
            var mentorDtos = _mapper.Map<IEnumerable<MentorProfileDto>>(mentors);

            await _cache.SetAsync(cacheKey, mentorDtos, TimeSpan.FromMinutes(15), TimeSpan.FromHours(1));

            return mentorDtos;
        }

        public async Task<IEnumerable<MentorProfileDto>> GetPendingMentorApplicationsAsync()
        {
            var mentors = await _mentorRepository.GetPendingMentorsAsync();
            return _mapper.Map<IEnumerable<MentorProfileDto>>(mentors);
        }

        public async Task ApproveMentorAsync(string mentorId)
        {
            var mentor = await _mentorRepository.GetMentorWithUserByIdAsync(mentorId);
            if (mentor == null)
            {
                throw new NotFoundException("Mentor", mentorId);
            }
            if (mentor.ApprovalStatus == MentorApprovalStatus.Approved)
            {
                throw new BusinessException("Mentor is already approved");
            }

            mentor.ApprovalStatus = MentorApprovalStatus.Approved;
            mentor.IsVerified = true;
            mentor.IsAvailable = true;
            mentor.UpdatedAt = DateTime.UtcNow;

            var user = mentor.User;
            if (!await _userManager.IsInRoleAsync(user, AppRoles.Mentor))
            {
                if (await _userManager.IsInRoleAsync(user, AppRoles.User))
                {
                    await _userManager.RemoveFromRoleAsync(user, AppRoles.User);
                }

                var roleResult = await _userManager.AddToRoleAsync(user, AppRoles.Mentor);
                if (!roleResult.Succeeded)
                {
                    throw new BusinessException("Failed to assign Mentor role");
                }
                _logger.LogInformation("User {UserId} promoted from User to Mentor role", user.Id);
            }

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

            try
            {
                await _notificationService.SendNotificationAsync(
                    mentorId,
                    NotificationType.MentorApplicationApproved,
                    "Application Approved!",
                    "Congratulations! Your mentor application has been approved. You can now start accepting sessions.",
                    "/mentor/profile");

                _logger.LogInformation("[Mentor] Approval notification sent to mentor {MentorId}", mentorId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Mentor] Failed to send approval notification to mentor {MentorId}", mentorId);
            }

            await InvalidateMentorsCacheAsync();
        }

        public async Task RejectMentorAsync(string mentorId, RejectMentorDto rejectDto)
        {
            await _rejectValidator.ValidateAndThrowCustomAsync(rejectDto);
            var mentor = await _mentorRepository.GetMentorWithUserByIdAsync(mentorId);

            if (mentor == null)
            {
                throw new NotFoundException("Mentor", mentorId);
            }

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

            try
            {
                await _notificationService.SendNotificationAsync(
                    mentorId,
                    NotificationType.MentorApplicationRejected,
                    "Application Not Approved",
                    $"We're sorry, but your mentor application was not approved. Reason: {rejectDto.Reason}",
                    "/mentor/apply");

                _logger.LogInformation("[Mentor] Rejection notification sent to mentor {MentorId}", mentorId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Mentor] Failed to send rejection notification to mentor {MentorId}", mentorId);
            }

            _mentorRepository.Delete(mentor);
            await _mentorRepository.SaveChangesAsync();

            _logger.LogInformation("Mentor {MentorId} rejected and record deleted. Reason: {Reason}", mentorId, rejectDto.Reason);

            await InvalidateMentorsCacheAsync();
        }

        private async Task InvalidateMentorsCacheAsync()
        {
            var version = await _cache.GetAsync<int>(MentorsVersionKey);
            await _cache.SetAsync(MentorsVersionKey, version + 1);
        }

        public async Task<bool> IsMentorAsync(string userId)
        {
            return await _mentorRepository.IsMentorAsync(userId);
        }
    }
}
