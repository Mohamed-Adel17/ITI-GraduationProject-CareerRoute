using CareerRoute.Core.Constants;
using CareerRoute.Core.Exceptions;
using CareerRoute.Core.Settings;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Threading.RateLimiting;

namespace CareerRoute.Infrastructure.Extensions
{
    public static class RateLimitingExtensions
    {
        public static IServiceCollection AddRateLimitingInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            var settings = configuration.GetSection(nameof(RateLimitingSettings)).Get<RateLimitingSettings>() ?? new RateLimitingSettings();

            services.AddRateLimiter(options =>
            {
                options.OnRejected = (context, token) =>
                {
                    throw new RateLimitExceededException("Too many requests. Please try again later.");
                };

                // Global Limiter
                options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext,string>(httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            AutoReplenishment = true,
                            PermitLimit = settings.GlobalLimit,
                            Window = TimeSpan.FromMinutes(settings.WindowInMinutes),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // Auth Policy
                options.AddPolicy(RateLimitingPolicies.Auth, httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = settings.AuthLimit,
                            Window = TimeSpan.FromMinutes(settings.WindowInMinutes),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // Forget Password Policy
                options.AddPolicy(RateLimitingPolicies.ForgetPassword, httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = settings.ForgetPasswordLimit,
                            Window = TimeSpan.FromMinutes(settings.WindowInMinutes),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // Password Reset Policy
                options.AddPolicy(RateLimitingPolicies.PasswordReset, httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = settings.PasswordResetLimit,
                            Window = TimeSpan.FromMinutes(settings.WindowInMinutes),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                // Payment Policy
                options.AddPolicy(RateLimitingPolicies.Payment, httpContext =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = settings.PaymentLimit,
                            Window = TimeSpan.FromMinutes(settings.WindowInMinutes),
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));
            });

            return services;
        }
    }
}
