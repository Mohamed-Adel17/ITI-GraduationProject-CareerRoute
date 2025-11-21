using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.TimeSlots;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Services.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace CareerRoute.Core.Services.Implementations
{
    public class TimeSlotService : ITimeSlotService
    {
        private readonly ITimeSlotRepository _timeSlotRepository;
        private readonly IMentorRepository _mentorRepository;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IMapper _mapper;

        public TimeSlotService(
            ITimeSlotRepository timeSlotRepository,
            IMentorRepository mentorRepository,
            UserManager<ApplicationUser> userManager,
            IMapper mapper)
        {
            _timeSlotRepository = timeSlotRepository;
            _mentorRepository = mentorRepository;
            _userManager = userManager;
            _mapper = mapper;
        }

        public async Task<AvailableSlotsResponseDto> GetAvailableSlotsAsync(
            string mentorId,
            GetAvailableSlotsQueryDto query)
        {
            // Validate mentor exists and is approved
            var mentor = await _mentorRepository.GetMentorWithUserByIdAsync(mentorId);
            if (mentor == null)
            {
                throw new NotFoundException($"Mentor with ID '{mentorId}' not found");
            }

            if (mentor.User == null)
            {
                throw new BusinessException("Mentor user data not found");
            }

            if (mentor.ApprovalStatus != MentorApprovalStatus.Approved)
            {
                throw new BusinessException($"This mentor is not currently accepting bookings (Status: {mentor.ApprovalStatus})");
            }

            // Enforce 24-hour advance booking rule
            var minimumBookableTime = DateTime.UtcNow.AddHours(24);

            // Determine effective start date
            // If user provides a date, use it but clamp it to minimumBookableTime
            // If user doesn't provide a date, default to minimumBookableTime
            var requestedStartDate = query.StartDate ?? minimumBookableTime;
            var effectiveStartDate = requestedStartDate < minimumBookableTime ? minimumBookableTime : requestedStartDate;

            // Determine effective end date
            var effectiveEndDate = query.EndDate ?? effectiveStartDate.AddDays(90);

            // Get available slots using the effective range
            var slots = await _timeSlotRepository.GetAvailableSlotsForMentorAsync(
                mentorId,
                effectiveStartDate,
                effectiveEndDate,
                query.DurationMinutes);

            var slotsList = slots.ToList();

            // Map to DTOs
            var availableSlots = _mapper.Map<List<AvailableSlotDto>>(slotsList);

            return new AvailableSlotsResponseDto
            {
                MentorId = mentorId,
                MentorName = $"{mentor.User.FirstName} {mentor.User.LastName}",
                AvailableSlots = availableSlots,
                TotalCount = availableSlots.Count,
                DateRange = new DateRangeDto
                {
                    StartDate = effectiveStartDate.ToString("yyyy-MM-dd"),
                    EndDate = effectiveEndDate.ToString("yyyy-MM-dd")
                }
            };
        }

        public async Task<TimeSlotDto> CreateTimeSlotAsync(
            string mentorId,
            string currentUserId,
            CreateTimeSlotDto createDto)
        {
            var batchDto = new BatchCreateTimeSlotsDto
            {
                Slots = new List<CreateTimeSlotDto> { createDto }
            };

            var results = await CreateTimeSlotsAsync(mentorId, currentUserId, batchDto);
            return results.First();
        }

        public async Task<List<TimeSlotDto>> CreateTimeSlotsAsync(
            string mentorId,
            string currentUserId,
            BatchCreateTimeSlotsDto batchDto)
        {
            // Validate authorization
            await ValidateOwnershipAsync(mentorId, currentUserId);

            // Validate mentor exists
            var mentor = await _mentorRepository.GetByIdAsync(mentorId);
            if (mentor == null)
            {
                throw new NotFoundException("Mentor", mentorId);
            }

            // Check for internal overlaps in the batch
            var sortedSlots = batchDto.Slots.OrderBy(s => s.StartDateTime).ToList();
            for (int i = 0; i < sortedSlots.Count - 1; i++)
            {
                var current = sortedSlots[i];
                var next = sortedSlots[i + 1];
                var currentEnd = current.StartDateTime.AddMinutes(current.DurationMinutes);

                if (next.StartDateTime < currentEnd)
                {
                    throw new ConflictException($"The batch contains overlapping slots: {current.StartDateTime} overlaps with {next.StartDateTime}");
                }
            }

            // Check for overlaps with existing slots
            foreach (var slotDto in batchDto.Slots)
            {
                var endTime = slotDto.StartDateTime.AddMinutes(slotDto.DurationMinutes);
                var hasOverlap = await _timeSlotRepository.HasOverlapAsync(mentorId, slotDto.StartDateTime, endTime);
                if (hasOverlap)
                {
                    throw new ConflictException($"The time slot at {slotDto.StartDateTime:yyyy-MM-dd HH:mm} overlaps with an existing slot.");
                }
            }

            // Create all time slots
            var timeSlots = new List<TimeSlot>();
            var createdAt = DateTime.UtcNow;

            foreach (var slotDto in batchDto.Slots)
            {
                var timeSlot = new TimeSlot
                {
                    Id = Guid.NewGuid().ToString(),
                    MentorId = mentorId,
                    StartDateTime = slotDto.StartDateTime,
                    DurationMinutes = slotDto.DurationMinutes,
                    IsBooked = false,
                    SessionId = null,
                    CreatedAt = createdAt
                };

                timeSlots.Add(timeSlot);
                await _timeSlotRepository.AddAsync(timeSlot);
            }

            await _timeSlotRepository.SaveChangesAsync();

            // Reload all slots with mentor for mapping
            var createdSlots = new List<TimeSlotDto>();
            foreach (var slot in timeSlots)
            {
                var reloadedSlot = await _timeSlotRepository.GetSlotByIdAsync(slot.Id);
                createdSlots.Add(_mapper.Map<TimeSlotDto>(reloadedSlot));
            }

            return createdSlots;
        }

        public async Task<TimeSlotListResponseDto> GetMentorTimeSlotsAsync(
            string mentorId,
            string currentUserId,
            GetMentorSlotsQueryDto query)
        {
            // Validate authorization
            await ValidateOwnershipAsync(mentorId, currentUserId);

            // Validate mentor exists
            var mentor = await _mentorRepository.GetByIdAsync(mentorId);
            if (mentor == null)
            {
                throw new NotFoundException("Mentor", mentorId);
            }

            // Get total count for pagination
            var totalCount = await _timeSlotRepository.GetSlotCountForMentorAsync(
                mentorId,
                query.StartDate,
                query.EndDate,
                query.IsBooked);

            // Get slots
            var slots = await _timeSlotRepository.GetMentorSlotsAsync(
                mentorId,
                query.StartDate,
                query.EndDate,
                query.IsBooked,
                query.Page,
                query.PageSize);

            var slotsList = slots.ToList();

            // Map to DTOs
            var timeSlotDtos = _mapper.Map<List<TimeSlotDto>>(slotsList);

            // Calculate pagination metadata
            var totalPages = (int)Math.Ceiling(totalCount / (double)query.PageSize);

            // Calculate summary statistics
            var allSlots = await _timeSlotRepository.GetMentorSlotsAsync(
                mentorId,
                query.StartDate,
                query.EndDate,
                null, // Get all slots for summary
                1,
                int.MaxValue);

            var allSlotsList = allSlots.ToList();
            var availableCount = allSlotsList.Count(s => !s.IsBooked);
            var bookedCount = allSlotsList.Count(s => s.IsBooked);

            return new TimeSlotListResponseDto
            {
                TimeSlots = timeSlotDtos,
                Pagination = new PaginationMetadata
                {
                    TotalCount = totalCount,
                    CurrentPage = query.Page,
                    PageSize = query.PageSize,
                    TotalPages = totalPages,
                    HasNextPage = query.Page < totalPages,
                    HasPreviousPage = query.Page > 1
                },
                Summary = new SlotsSummary
                {
                    TotalSlots = allSlotsList.Count,
                    AvailableSlots = availableCount,
                    BookedSlots = bookedCount
                }
            };
        }

        public async Task DeleteTimeSlotAsync(
            string mentorId,
            string slotId,
            string currentUserId)
        {
            // Validate authorization
            await ValidateOwnershipAsync(mentorId, currentUserId);

            // Get slot
            var slot = await _timeSlotRepository.GetSlotByIdAsync(slotId);
            if (slot == null)
            {
                throw new NotFoundException("Time slot", slotId);
            }

            // Verify slot belongs to this mentor
            if (slot.MentorId != mentorId)
            {
                throw new NotFoundException("Time slot", slotId);
            }

            // Check if slot is booked
            if (slot.IsBooked)
            {
                throw new ConflictException("Cannot delete a booked time slot. Please cancel the session first.");
            }

            // Delete slot
            _timeSlotRepository.Delete(slot);
            await _timeSlotRepository.SaveChangesAsync();
        }

        private async Task ValidateOwnershipAsync(string mentorId, string currentUserId)
        {
            // Check if user is admin
            var user = await _userManager.FindByIdAsync(currentUserId);
            if (user == null)
            {
                throw new UnauthenticatedException("Invalid authentication token");
            }

            var isAdmin = await _userManager.IsInRoleAsync(user, "Admin");
            if (isAdmin)
            {
                return; // Admin can manage any mentor's slots
            }

            // Check if user owns this mentor profile
            if (currentUserId != mentorId)
            {
                throw new UnauthorizedException("You can only manage time slots for your own mentor profile");
            }
        }
    }
}
