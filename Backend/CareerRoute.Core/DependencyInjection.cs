using CareerRoute.Core.Mappings;
using CareerRoute.Core.Services.Implementations;
using CareerRoute.Core.Services.Interfaces;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace CareerRoute.Core;

public static class DependencyInjection
{
    public static IServiceCollection AddCore(this IServiceCollection services)
    {
        // Business Logic Services Registration
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuthenticationService, AuthenticationService>();

        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IMentorService, MentorService>();
        services.AddScoped<ISkillService, SkillService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<ISessionService, SessionService>();
        services.AddScoped<ITimeSlotService, TimeSlotService>();
        services.AddScoped<IPaymentProcessingService, PaymentProcessingService>();
        services.AddScoped<IEmailTemplateService, EmailTemplateService>();
        services.AddScoped<IRescheduleSessionService, RescheduleSessionService>();
        services.AddScoped<IAiSummaryService, AiSummaryService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IMentorBalanceService, MentorBalanceService>();
        services.AddScoped<IPayoutService, PayoutService>();
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<ISessionDisputeService, SessionDisputeService>();
        services.AddScoped<IPreviousWorkService, PreviousWorkService>();

        services.AddAutoMapper(options =>
        {
            options.AddProfile<MentorMappingProfile>();
            options.AddProfile<UserMappingProfile>();
            options.AddProfile<SkillMappingProfile>();
            options.AddProfile<CategoryMappingProfile>();
            options.AddProfile<PaymentProfile>();
            options.AddProfile<TimeSlotMappingProfile>();
            options.AddProfile<SessionProfile>();
            options.AddProfile<NotificationProfile>();
            options.AddProfile<PayoutMappingProfile>();
            options.AddProfile<ReviewsProfile>();
            options.AddProfile<DisputeMappingProfile>();
        });

        // Register all FluentValidation validators from this assembly
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        return services;
    }
}
