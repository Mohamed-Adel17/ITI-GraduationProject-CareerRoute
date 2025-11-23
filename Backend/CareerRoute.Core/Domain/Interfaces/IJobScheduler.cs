using System;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace CareerRoute.Core.Domain.Interfaces
{
    /// <summary>
    /// Interface for scheduling background jobs
    /// </summary>
    public interface IJobScheduler
    {
        /// <summary>
        /// Schedules a method call to run after a specified delay
        /// </summary>
        /// <typeparam name="T">The type of the service containing the method</typeparam>
        /// <param name="methodCall">The method call expression</param>
        /// <param name="delay">The delay before execution</param>
        /// <returns>The unique identifier of the scheduled job</returns>
        string Schedule<T>(Expression<Action<T>> methodCall, TimeSpan delay);
        
        /// <summary>
        /// Schedules a method call to run at a specific time
        /// </summary>
        /// <typeparam name="T">The type of the service containing the method</typeparam>
        /// <param name="methodCall">The method call expression</param>
        /// <param name="enqueueAt">The exact time to execute the job</param>
        /// <returns>The unique identifier of the scheduled job</returns>
        string Schedule<T>(Expression<Action<T>> methodCall, DateTimeOffset enqueueAt);

        /// <summary>
        /// Enqueues a method call to run immediately
        /// </summary>
        /// <typeparam name="T">The type of the service containing the method</typeparam>
        /// <param name="methodCall">The method call expression</param>
        /// <returns>The unique identifier of the enqueued job</returns>
        string Enqueue<T>(Expression<Action<T>> methodCall);

        /// <summary>
        /// Deletes a scheduled job by its ID
        /// </summary>
        /// <param name="jobId">The ID of the job to delete</param>
        /// <returns>True if successful</returns>
        bool Delete(string jobId);
    }
}
