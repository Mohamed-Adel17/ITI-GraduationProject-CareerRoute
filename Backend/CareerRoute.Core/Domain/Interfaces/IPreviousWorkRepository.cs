using CareerRoute.Core.Domain.Entities;

namespace CareerRoute.Core.Domain.Interfaces
{
    public interface IPreviousWorkRepository : IBaseRepository<PreviousWork>
    {
        Task<PreviousWork?> GetByIdAsync(int id);
        Task<IEnumerable<PreviousWork>> GetByMentorIdAsync(string mentorId);
    }
}
