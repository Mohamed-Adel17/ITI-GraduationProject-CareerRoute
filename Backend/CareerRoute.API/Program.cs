using CareerRoute.API.Middleware;
using CareerRoute.Core;
using CareerRoute.Core.Constants;
using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Setting;
using CareerRoute.Infrastructure;
using CareerRoute.Infrastructure.Data;
using CareerRoute.Infrastructure.Data.SeedData;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Net;
using System.Reflection;
using System.Text;
using Hangfire;
using CareerRoute.Infrastructure.Hubs;
using Hangfire.Dashboard;

var builder = WebApplication.CreateBuilder(args);


//CORS Configuration
var frontendUrls = builder.Configuration.GetSection("FrontendUrls").Get<string[]>()
    ?? new[] { "http://localhost:4200" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(frontendUrls)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Add services to the container.
// Clean Architecture Layers
builder.Services.AddCore();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddConfigurationInfrastructure(builder.Configuration);

builder.Services.AddAuthentication(
    (options) =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;

    }).
    AddJwtBearer(
    JwtBearerDefaults.AuthenticationScheme,
    (option) =>
    {
        var jwtSettings = builder.Configuration.GetSection(nameof(JwtSettings)).Get<JwtSettings>()!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey));

        option.SaveToken = true;
        option.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = key,
        };
    }
    );


//Adding Authorization Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AppPolicies.RequireUserRole,
        policy => policy.RequireRole(AppRoles.User));
    options.AddPolicy(AppPolicies.RequireAdminRole,
        policy => policy.RequireRole(AppRoles.Admin));
    options.AddPolicy(AppPolicies.RequireMentorRole,
        policy => policy.RequireRole(AppRoles.Mentor));
    options.AddPolicy(AppPolicies.RequireMentorOrAdminRole,
        policy => policy.RequireRole(AppRoles.Mentor, AppRoles.Admin));
    options.AddPolicy(AppPolicies.RequireAnyRole,
        policy => policy.RequireRole(AppRoles.User, AppRoles.Admin, AppRoles.Mentor));
});


// API Layer Services
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.Converters.Add(new CareerRoute.API.Converters.UtcDateTimeConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddSignalR();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CareerRoute API",
        Version = "v1",
        Description = "API for CareerRoute - A platform connecting mentors and mentees for career guidance",
        Contact = new OpenApiContact
        {
            Name = "CareerRoute Team",
            Email = "support@careerroute.com"
        }
    });

    // Include XML comments for Swagger documentation
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    c.IncludeXmlComments(xmlPath);

    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var enableSwagger = builder.Environment.IsDevelopment() ||
    builder.Configuration.GetValue<bool>("Swagger:Enabled");
var swaggerRoutePrefix = builder.Configuration.GetValue<string>("Swagger:RoutePrefix");
var enableHttpsRedirection = builder.Configuration.GetValue<bool?>("HttpsRedirection:Enabled") ?? true;

var app = builder.Build();

// Configure the HTTP request pipeline.
if (enableSwagger)
{
    app.UseMiddleware<SwaggerBasicAuthMiddleware>();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "CareerRoute API v1");
        if (app.Environment.IsDevelopment())
        {
            c.RoutePrefix = "swagger";
        }
        else
        {
            c.RoutePrefix = string.IsNullOrWhiteSpace(swaggerRoutePrefix)
                ? string.Empty
                : swaggerRoutePrefix;
        }
    });
}

if (enableHttpsRedirection)
{
    app.UseHttpsRedirection();
}
app.UseGlobalExceptionHandler();

app.UseCors("AllowFrontend");

app.UseRateLimiter();
app.UseMiddleware<RequestLoggingMiddleware>();

//Authentication then Authorization
app.UseWebSockets();
app.UseAuthentication();
app.UseAuthorization();

var hangfireDashboardOptions = new DashboardOptions
{
    Authorization = new[] { new HangfireDashboardAuthorizationFilter(app.Environment) }
};

app.UseHangfireDashboard("/hangfire", hangfireDashboardOptions);
app.MapHub<PaymentHub>("hub/payment");

app.MapControllers();

// Apply pending migrations automatically on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        var context = services.GetRequiredService<ApplicationDbContext>();
        
        logger.LogInformation("Applying database migrations...");
        await context.Database.MigrateAsync();
        logger.LogInformation("Database migrations applied successfully.");
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error applying database migrations");
    }
}

//seed roles on application startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var logger = services.GetRequiredService<ILogger<Program>>();

        await RoleSeeder.SeedRolesAsync(roleManager, logger);

    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error happened while seeding roles");
    }
}

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        var context = services.GetRequiredService<ApplicationDbContext>();

        await CategorySeeder.SeedCategoriesAsync(context, logger);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error happened while seeding categories");
    }
}

//seed skills on application startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        var context = services.GetRequiredService<ApplicationDbContext>();

        await SkillSeeder.SeedSkillsAsync(context, logger);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error happened while seeding skills");
    }
}

//seed test data on application startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var env = services.GetRequiredService<IWebHostEnvironment>();
        var configuration = services.GetRequiredService<IConfiguration>();
        var forceSeeding = configuration.GetValue<bool>("SeedData:ForceSeeding");
        
        logger.LogInformation("=== SEED DATA CONFIG: ForceSeeding = {ForceSeeding}, Environment = {Env} ===", 
            forceSeeding, env.EnvironmentName);

        await TestDataSeeder.SeedTestDataAsync(context, userManager, logger, env, forceSeeding);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error happened while seeding test data");
    }
}

app.Run();

internal sealed class HangfireDashboardAuthorizationFilter : IDashboardAuthorizationFilter
{
    private readonly IWebHostEnvironment _environment;

    public HangfireDashboardAuthorizationFilter(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();
        if (httpContext == null)
        {
            return false;
        }

        if (_environment.IsDevelopment())
        {
            var remoteIp = httpContext.Connection.RemoteIpAddress;
            return remoteIp != null && IPAddress.IsLoopback(remoteIp);
        }

        var user = httpContext.User;
        return user?.Identity?.IsAuthenticated == true && user.IsInRole(AppRoles.Admin);
    }
}

public partial class Program { }
