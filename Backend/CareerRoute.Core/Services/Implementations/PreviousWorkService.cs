using AutoMapper;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.DTOs.Mentors;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Extentions;
using CareerRoute.Core.Services.Interfaces;
using FluentValidation;

namespace CareerRoute.Core.Services.Implementations
{
    public class PreviousWorkService : IPreviousWorkService
    {
        private readonly IPreviousWorkRepository _repository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreatePreviousWorkDto> _previousWorkValidator;

        public PreviousWorkService(IPreviousWorkRepository repository, IMapper mapper, IValidator<CreatePreviousWorkDto> previousWorkValidator)
        {
            _repository = repository;
            _mapper = mapper;
            _previousWorkValidator = previousWorkValidator;
        }

        public async Task<IEnumerable<PreviousWorkDto>> GetByMentorIdAsync(string mentorId)
        {
            var works = await _repository.GetByMentorIdAsync(mentorId);
            return _mapper.Map<IEnumerable<PreviousWorkDto>>(works);
        }

        public async Task<PreviousWorkDto> AddAsync(string mentorId, CreatePreviousWorkDto dto)
        {
            await _previousWorkValidator.ValidateAndThrowCustomAsync(dto);

            var work = new PreviousWork
            {
                MentorId = mentorId,
                CompanyName = dto.CompanyName,
                JobTitle = dto.JobTitle,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Description = dto.Description
            };

            await _repository.AddAsync(work);
            await _repository.SaveChangesAsync();

            return _mapper.Map<PreviousWorkDto>(work);
        }

        public async Task<PreviousWorkDto> UpdateAsync(string mentorId, int id, UpdatePreviousWorkDto dto)
        {
            var work = await _repository.GetByIdAsync(id);
            if (work == null || work.MentorId != mentorId)
                throw new NotFoundException("PreviousWork", id.ToString());

            if (dto.CompanyName != null) work.CompanyName = dto.CompanyName;
            if (dto.JobTitle != null) work.JobTitle = dto.JobTitle;
            if (dto.StartDate.HasValue) work.StartDate = dto.StartDate.Value;
            if (dto.EndDate.HasValue) work.EndDate = dto.EndDate;
            if (dto.Description != null) work.Description = dto.Description;

            _repository.Update(work);
            await _repository.SaveChangesAsync();

            return _mapper.Map<PreviousWorkDto>(work);
        }

        public async Task DeleteAsync(string mentorId, int id)
        {
            var work = await _repository.GetByIdAsync(id);
            if (work == null || work.MentorId != mentorId)
                throw new NotFoundException("PreviousWork", id.ToString());

            _repository.Delete(work);
            await _repository.SaveChangesAsync();
        }
    }
}
