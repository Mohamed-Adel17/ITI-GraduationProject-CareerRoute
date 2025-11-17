using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Infrastructure.Data;

namespace CareerRoute.Infrastructure.Repositories
{
    public class SessionRepository : GenericRepository<Session>, ISessionRepository
    {
        public SessionRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }
    }
}
