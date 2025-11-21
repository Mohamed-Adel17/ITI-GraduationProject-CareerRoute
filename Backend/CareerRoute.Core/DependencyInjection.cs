using CareerRoute.Core.Domain.Interfaces;
using CareerRoute.Core.Mappings;
using CareerRoute.Core.Services.Implementations;
using CareerRoute.Core.Services.Interfaces;
using CareerRoute.Core.Validators.Mentors;
using CareerRoute.Core.Validators.Payments;
using CareerRoute.Core.Validators.Sessions;
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
        services.AddScoped<IAuthenticationService, AuthenticationService>();

        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IMentorService, MentorService>();
        services.AddScoped<ISkillService, SkillService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<ISessionService, SessionService>();

        services.AddAutoMapper(options =>
        {
            options.AddProfile<MentorMappingProfile>();
            options.AddProfile<UserMappingProfile>();
            options.AddProfile<SkillMappingProfile>();
            options.AddProfile<CategoryMappingProfile>();
            options.AddProfile<PaymentProfile>();
            options.AddProfile<SessionProfile>();
        });


        // ============ FLUENTVALIDATION ============

        services.AddValidatorsFromAssemblyContaining<UpdateMentorProfileValidator>();
        services.AddValidatorsFromAssemblyContaining<PaymentIntentRequestValidator>();
        services.AddValidatorsFromAssemblyContaining<PaymentConfirmRequestValidator>();
        services.AddValidatorsFromAssemblyContaining<BookSessionRequestValidator>();
        services.AddValidatorsFromAssemblyContaining<RescheduleSessionRequestValidator>();
        services.AddValidatorsFromAssemblyContaining<CancelSessionRequestValidator>();


        return services;
    }


}
