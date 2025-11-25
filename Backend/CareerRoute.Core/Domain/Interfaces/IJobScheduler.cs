using CareerRoute.Core.Domain.Interfaces;
using Hangfire;
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
        string Schedule<T>(Expression<Action<T>> methodCall, TimeSpan delay);
        string Schedule<T>(Expression<Action<T>> methodCall, DateTimeOffset enqueueAt);
        string Enqueue<T>(Expression<Action<T>> methodCall);
        string EnqueueAsync<T>(Expression<Func<T, Task>> methodCall);
        bool Delete(string jobId);

        // Zoom branch convenience: schedule a simple delegate
        string ScheduleJob(Func<Task> job, TimeSpan delay);
    }
}
