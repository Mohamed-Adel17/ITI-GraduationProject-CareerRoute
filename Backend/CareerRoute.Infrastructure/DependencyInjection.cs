using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.Setting;
using CareerRoute.Infrastructure.Data;
using CareerRoute.Infrastructure.Repositories;
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
        // services.AddScoped<IUserRepository, UserRepository>();
        // services.AddScoped<IMentorRepository, MentorRepository>();
        // services.AddScoped<ISessionRepository, SessionRepository>();

        // Infrastructure Service Registration
        // Uncomment and add as you create services
        // services.AddScoped<IEmailService, EmailService>();
        // services.AddScoped<IPaymentService, StripePaymentService>();
        // services.AddScoped<IStorageService, AzureStorageService>();

        // Identity Configuration (if using)
        // services.AddIdentity<ApplicationUser, IdentityRole>()
        //     .AddEntityFrameworkStores<AppDbContext>()
        //     .AddDefaultTokenProviders();

        return services;
    }
}
