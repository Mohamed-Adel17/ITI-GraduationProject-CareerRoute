using CareerRoute.Core.DTOs.Mentors;

namespace CareerRoute.Core.Services.Interfaces
{
    public interface IPreviousWorkService
    {
        Task<IEnumerable<PreviousWorkDto>> GetByMentorIdAsync(string mentorId);
        Task<PreviousWorkDto> AddAsync(string mentorId, CreatePreviousWorkDto dto);
        Task<PreviousWorkDto> UpdateAsync(string mentorId, int id, UpdatePreviousWorkDto dto);
        Task DeleteAsync(string mentorId, int id);
    }
}
