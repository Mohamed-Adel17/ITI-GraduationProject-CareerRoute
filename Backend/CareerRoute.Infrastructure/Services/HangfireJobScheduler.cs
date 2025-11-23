using CareerRoute.Core.Domain.Interfaces;
using Hangfire;
using System;
using System.Linq.Expressions;

namespace CareerRoute.Infrastructure.Services
{
    /// <summary>
    /// Implementation of IJobScheduler using Hangfire
    /// </summary>
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

        public bool Delete(string jobId)
        {
            return _backgroundJobClient.Delete(jobId);
        }
    }
}
