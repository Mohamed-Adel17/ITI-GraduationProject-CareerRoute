using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Infrastructure.Repositories
{
    public class RescheduleSessionRepository : GenericRepository<RescheduleSession>, IRescheduleSessionRepository
    {
        public RescheduleSessionRepository(ApplicationDbContext dbContext) : base(dbContext)
        {
        }
    }
}
