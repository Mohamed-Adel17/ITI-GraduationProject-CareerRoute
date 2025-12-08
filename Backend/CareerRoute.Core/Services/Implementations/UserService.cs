using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.DTOs.Users;
using CareerRoute.Core.Services.Interfaces;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Extentions;

namespace CareerRoute.Core.Services.Implementations
{
    public class UserService : IUserService
    {
        private readonly IMapper _mapper;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IValidator<UpdateUserDto> _updateValidator;
        private readonly ISkillService _skillService;
        private readonly IBlobStorageService _blobStorageService;

        public UserService(
            IMapper mapper,
            UserManager<ApplicationUser> userManager,
            IValidator<UpdateUserDto> updateValidator,
            ISkillService skillService,
            IBlobStorageService blobStorageService)
        {
            _mapper = mapper;
            _userManager = userManager;
            _updateValidator = updateValidator;
            _skillService = skillService;
            _blobStorageService = blobStorageService;
        }

        public async Task<IEnumerable<RetrieveUserDto>> GetAllUsersAsync()
        {
            var users = await _userManager.Users
                .Where(u => !u.IsMentor)
                .Include(u => u.UserSkills)
                    .ThenInclude(us => us.Skill)
                        .ThenInclude(s => s.Category)
                .ToListAsync();

            var userDtos = _mapper.Map<IEnumerable<RetrieveUserDto>>(users);

            foreach (var userDto in userDtos)
            {
                var user = users.FirstOrDefault(u => u.Id == userDto.Id);
                if (user != null)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    userDto.Roles = roles.ToList();
                }
            }

            return userDtos;
        }

        public async Task<RetrieveUserDto> GetUserByIdAsync(string id)
        {
            var user = await _userManager.Users
                .Where(u => !u.IsMentor)
                .Include(u => u.UserSkills)
                    .ThenInclude(us => us.Skill)
                        .ThenInclude(s => s.Category)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
            {
                throw new NotFoundException("User", id);
            }

            var userDto = _mapper.Map<RetrieveUserDto>(user);
            var roles = await _userManager.GetRolesAsync(user);
            userDto.Roles = roles.ToList();

            return userDto;
        }

        public async Task<RetrieveUserDto> UpdateUserByIdAsync(string id, UpdateUserDto uuDto)
        {
            await _updateValidator.ValidateAndThrowCustomAsync(uuDto);

            var user = await _userManager.Users
                .Where(u => !u.IsMentor)
                .Include(u => u.UserSkills)
                    .ThenInclude(us => us.Skill)
                        .ThenInclude(s => s.Category)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (user == null)
                throw new NotFoundException("User", id);

            // Handle CareerInterestIds - Update UserSkills junction table
            if (uuDto.CareerInterestIds != null)
            {
                var isValid = await _skillService.ValidateSkillIdsAsync(uuDto.CareerInterestIds);
                if (!isValid)
                {
                    throw new Exceptions.ValidationException(new Dictionary<string, string[]>
                    {
                        ["CareerInterestIds"] = new[] { "One or more skill IDs are invalid or inactive" }
                    });
                }

                var existingSkills = user.UserSkills.ToList();
                user.UserSkills.Clear();

                foreach (var skillId in uuDto.CareerInterestIds)
                {
                    user.UserSkills.Add(new UserSkill
                    {
                        UserId = id,
                        SkillId = skillId,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            // Handle profile picture upload
            if (uuDto.ProfilePicture != null)
            {
                // Delete old picture if exists
                if (!string.IsNullOrEmpty(user.ProfilePictureStorageKey))
                {
                    try { await _blobStorageService.DeleteAsync(user.ProfilePictureStorageKey); }
                    catch { /* Ignore deletion errors */ }
                }

                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(uuDto.ProfilePicture.FileName)}";
                using var stream = uuDto.ProfilePicture.OpenReadStream();
                var storageKey = await _blobStorageService.UploadAsync(
                    stream,
                    fileName,
                    uuDto.ProfilePicture.ContentType,
                    FileType.ProfilePicture,
                    uuDto.ProfilePicture.Length);
                user.ProfilePictureStorageKey = storageKey;
                user.ProfilePictureUrl = await _blobStorageService.GetPresignedUrlAsync(storageKey);
                user.ProfilePictureUrlExpiry = DateTime.UtcNow.AddDays(7);
            }

            // Map other fields
            if (uuDto.FirstName != null) user.FirstName = uuDto.FirstName;
            if (uuDto.LastName != null) user.LastName = uuDto.LastName;
            if (uuDto.PhoneNumber != null) user.PhoneNumber = uuDto.PhoneNumber;
            if (uuDto.CareerGoals != null) user.CareerGoal = uuDto.CareerGoals;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new BusinessException($"Update failed: {errors}");
            }

            // Reload user with skills to get updated data
            user = await _userManager.Users
                .Where(u => !u.IsMentor)
                .Include(u => u.UserSkills)
                    .ThenInclude(us => us.Skill)
                        .ThenInclude(s => s.Category)
                .FirstOrDefaultAsync(u => u.Id == id);

            var userDto = _mapper.Map<RetrieveUserDto>(user);
            var roles = await _userManager.GetRolesAsync(user);
            userDto.Roles = roles.ToList();

            return userDto;
        }

        public async Task DeleteUserByIdAsync(string id)
        {
            var user = await _userManager.Users
                .Where(u => !u.IsMentor)
                .FirstOrDefaultAsync(u => u.Id == id);
            if (user == null)
                throw new NotFoundException("User", id);

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new BusinessException($"Delete failed: {errors}");
            }
        }
    }
}
