using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.Mappings;
using CareerRoute.Core.Services.Implementations;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Validators.Mentors;
using CareerRoute.Core.Validators.Users;

using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace CareerRoute.Core;

public static class DependencyInjection
{
    public static IServiceCollection AddCore(this IServiceCollection services)
    {
        // Business Logic Services Registration
        // Uncomment and add as you create services


        services.AddScoped<ITokenService, TokenService>();

        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IMentorService, MentorService>();
        // services.AddScoped<ISessionService, SessionService>();
        // services.AddScoped<IAuthService, AuthService>();

        services.AddAutoMapper(options =>
        {
            options.AddProfile<UserProfile>();
        });

        services.AddAutoMapper(options =>
        {
            options.AddProfile<MentorMappingProfile>();
        });


        // ============ FLUENTVALIDATION ============
        services.AddValidatorsFromAssemblyContaining<CreateUserValidator>();
        services.AddValidatorsFromAssemblyContaining<UpdateUserValidator>();

        services.AddValidatorsFromAssemblyContaining<UpdateMentorProfileValidator>();

        return services;
    }


}
