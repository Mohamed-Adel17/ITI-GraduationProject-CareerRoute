using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.Domain.Interfaces.Services;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Setting;
using CareerRoute.Core.Settings;
using CareerRoute.Infrastructure.Data;
using CareerRoute.Infrastructure.Repositories;
using CareerRoute.Infrastructure.Services;
using Hangfire;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;


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

        services.AddScoped<ITokenRepository, TokenRepository>();

        // Repository Registration
        // Uncomment and add as you create repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IMentorRepository, MentorRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<ISkillRepository, SkillRepository>();
        services.AddScoped<ISessionRepository, SessionRepository>();
        services.AddScoped<ITimeSlotRepository, TimeSlotRepository>();
        services.AddScoped<IRescheduleSessionRepository, RescheduleSessionRepository>();
        services.AddScoped<ICancelSessionRepository, CancelSessionRepository>();
         services.AddScoped<IPaymentRepository, PaymentRepository>();
        services.AddScoped(typeof(IBaseRepository<>), typeof(GenericRepository<>));

        // Infrastructure Service Registration
        services.AddScoped<IEmailService, SendGridEmailService>();
        services.AddScoped<IStripePaymentService, StripePaymentService>();
        services.AddScoped<IPaymobPaymentService, PaymobPaymentService>();
        services.AddScoped<IPaymentNotificationService, SignalRPaymentNotificationService>();

        services.AddScoped<IPaymentFactory, PaymentFactory>();
        services.AddHttpClient();
        // Uncomment and add as you create services
        // services.AddScoped<IStorageService, AzureStorageService>();

        // Identity Configuration (if using)
        //services.AddIdentity<ApplicationUser, IdentityRole>()
        //    .AddEntityFrameworkStores<ApplicationDbContext>()
        //    .AddDefaultTokenProviders();
        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
        {
            options.User.RequireUniqueEmail = true; // Ensure unique email addresses
            options.Password.RequireNonAlphanumeric = false;
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
            options.Lockout.AllowedForNewUsers = true;
        })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

        services.AddHangfire(config => config
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UseSqlServerStorage(configuration.GetConnectionString("DefaultConnection")));

        services.AddHangfireServer();


        return services;
    }
}
