using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using CareerRoute.Core.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using CareerRoute.Infrastructure.Data;
namespace CareerRoute.Infrastructure.Repositories
{
    public class GenericRepository<T> : IBaseRepository<T> where T : class
    {
        protected readonly ApplicationDbContext dbContext;

        public GenericRepository(ApplicationDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public virtual async Task<IEnumerable<T>> GetAllAsync()
        {
            return await dbContext.Set<T>().ToListAsync();
        }

        public virtual async Task<T?> GetByIdAsync(string id)
        {
            return await dbContext.Set<T>().FindAsync(id);
        }

        public virtual async Task AddAsync(T entity)
        {
            await dbContext.Set<T>().AddAsync(entity);
        }

        public virtual void Update(T entity)
        {
            dbContext.Set<T>().Update(entity);
        }

        public virtual void Delete(T entity)
        {
            dbContext.Set<T>().Remove(entity);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await dbContext.SaveChangesAsync();
        }

    }
}
