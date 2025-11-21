using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Setting;
using CareerRoute.Core.Settings;
using CareerRoute.Infrastructure.Data;
using CareerRoute.Infrastructure.Repositories;
using Microsoft.AspNetCore.Identity;
using CareerRoute.Infrastructure.Services;
using CareerRoute.Infrastructure.Services;
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
        services.AddScoped<IEmailService, SendGridEmailService>();

        // Repository Registration
        // Uncomment and add as you create repositories
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IMentorRepository, MentorRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<ISkillRepository, SkillRepository>();
        services.AddScoped<ITimeSlotRepository, TimeSlotRepository>();
        // services.AddScoped<ISessionRepository, SessionRepository>();
        services.AddScoped(typeof(IBaseRepository<>), typeof(GenericRepository<>));


        // Infrastructure Service Registration
        // Uncomment and add as you create services
        // services.AddScoped<ITimeSlotService, TimeSlotService>();
        // services.AddScoped<IEmailService, EmailService>();
        // services.AddScoped<IPaymentService, StripePaymentService>();
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

        return services;
    }
}
