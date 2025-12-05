using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.Domain.Interfaces.Services;
using CareerRoute.Infrastructure.Services;
using CareerRoute.Infrastructure.Extensions;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Setting;
using CareerRoute.Core.Settings;
using CareerRoute.Infrastructure.Data;
using CareerRoute.Infrastructure.Repositories;
using Hangfire;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using CareerRoute.Infrastructure.BackgroundJobs;

namespace CareerRoute.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddConfigurationInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<JwtSettings>(configuration.GetSection(nameof(JwtSettings)));
        services.Configure<EmailSettings>(configuration.GetSection(nameof(EmailSettings)));
        services.Configure<PaymentSettings>(configuration.GetSection(nameof(PaymentSettings)));
        services.Configure<ZoomSettings>(configuration.GetSection(nameof(ZoomSettings)));
        services.Configure<OpenAISettings>(configuration.GetSection(nameof(OpenAISettings)));
        services.Configure<DeepgramSettings>(configuration.GetSection(nameof(DeepgramSettings)));
        services.Configure<R2Settings>(configuration.GetSection(nameof(R2Settings)));
        services.Configure<RateLimitingSettings>(configuration.GetSection(nameof(RateLimitingSettings)));
        services.Configure<GitHubSettings>(configuration.GetSection(nameof(GitHubSettings)));
        return services;
    }

    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Database Configuration
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"))
        );

        // Repository Registration
        services.AddScoped<ITokenRepository, TokenRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IMentorRepository, MentorRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<ISkillRepository, SkillRepository>();
        services.AddScoped<ISessionRepository, SessionRepository>();
        services.AddScoped<ITimeSlotRepository, TimeSlotRepository>();
        services.AddScoped<IRescheduleSessionRepository, RescheduleSessionRepository>();
        services.AddScoped<ICancelSessionRepository, CancelSessionRepository>();
        services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<IMentorBalanceRepository, MentorBalanceRepository>();
        services.AddScoped<IPayoutRepository, PayoutRepository>();
        services.AddScoped<IReviewRepository, ReviewRepository>();
        services.AddScoped(typeof(IBaseRepository<>), typeof(GenericRepository<>));

        // Infrastructure Service Registration
        services.AddScoped<IEmailService, SendGridEmailService>();
        services.AddScoped<IStripePaymentService, StripePaymentService>();
        services.AddScoped<IPaymobPaymentService, PaymobPaymentService>();
        services.AddScoped<IPaymentNotificationService, SignalRPaymentNotificationService>();
        services.AddScoped<ISignalRNotificationService, SignalRNotificationService>();
        services.AddScoped<IPaymentFactory, PaymentFactory>();

        services.AddScoped<IZoomService, ZoomService>();
        services.AddScoped<ICalendarService, CalendarService>();
        services.AddScoped<IDeepgramService, DeepgramService>();
        services.AddScoped<IBlobStorageService, CloudflareR2Service>();
        services.AddScoped<IJobScheduler, HangfireJobScheduler>();
        services.AddScoped<ISessionReminderJobService, SessionReminderJobService>();
        services.AddScoped<IReleasePaymentJob, ReleasePaymentBackgroundJob>();


        // AI Client Registration
        services.AddHttpClient<OpenAiClient>(c => c.Timeout = TimeSpan.FromMinutes(5));
        services.AddHttpClient<GitHubModelsClient>(c => c.Timeout = TimeSpan.FromMinutes(5));
        services.AddScoped<IAiClient, AiClientFacade>();

        // HttpClient Configuration
        services.AddHttpClient();

        // Identity Configuration
        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
        {
            options.User.RequireUniqueEmail = true;
            options.Password.RequireNonAlphanumeric = false;
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
            options.Lockout.AllowedForNewUsers = true;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders();

        // Hangfire Configuration
        services.AddHangfire(config => config
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UseSqlServerStorage(configuration.GetConnectionString("DefaultConnection")));

        services.AddHangfireServer();

        services.AddMemoryCache();
        services.AddScoped<ICacheService, CacheService>();
        services.AddRateLimitingInfrastructure(configuration);

        return services;
    }
}
