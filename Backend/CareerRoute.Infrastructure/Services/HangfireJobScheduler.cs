using CareerRoute.Core.Domain.Interfaces;
using Hangfire;
using System;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace CareerRoute.Infrastructure.Services
{
    public class HangfireJobScheduler : IJobScheduler
    {
        private readonly IBackgroundJobClient _backgroundJobClient;

        public HangfireJobScheduler(IBackgroundJobClient backgroundJobClient)
        {
            _backgroundJobClient = backgroundJobClient;
        }

        public string Schedule<T>(Expression<Action<T>> methodCall, TimeSpan delay)
        {
            return _backgroundJobClient.Schedule(methodCall, delay);
        }

        public string Schedule<T>(Expression<Action<T>> methodCall, DateTimeOffset enqueueAt)
        {
            return _backgroundJobClient.Schedule(methodCall, enqueueAt);
        }

        public string Enqueue<T>(Expression<Action<T>> methodCall)
        {
            return _backgroundJobClient.Enqueue(methodCall);
        }

        public string EnqueueAsync<T>(Expression<Func<T, Task>> methodCall)
        {
            return _backgroundJobClient.Enqueue(methodCall);
        }

        public bool Delete(string jobId)
        {
            return _backgroundJobClient.Delete(jobId);
        }

        public string ScheduleJob(Func<Task> job, TimeSpan delay)
        {
            return _backgroundJobClient.Schedule(() => job(), delay);
        }
    }
}
