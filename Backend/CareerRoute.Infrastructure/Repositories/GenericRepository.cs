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
        private readonly ApplicationDbContext dbContext;

        public GenericRepository(ApplicationDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public async Task<IEnumerable<T>> GetAllAsync()
        {
            return await dbContext.Set<T>().ToListAsync();
        }

        public async Task<T?> GetByIdAsync(string id)
        {
            return await dbContext.Set<T>().FindAsync(id);
        }

        public async Task AddAsync(T entity)
        {
            await dbContext.Set<T>().AddAsync(entity);
            //not saved in DB yet
        }

        public void Update(T entity)
        {
            dbContext.Set<T>().Update(entity);
            //not saved in DB  yet
        }

        public void Delete(T entity)
        {
            dbContext.Set<T>().Remove(entity);
            //not saved in DB yet
        }

        public async Task<int> SaveChangesAsync()
        {
            return await dbContext.SaveChangesAsync();
        }

    }
}
