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
using Microsoft.VisualBasic;
using System.Reflection;
using System.Text;

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
builder.Services.AddControllers();

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

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseGlobalExceptionHandler();

app.UseCors("AllowFrontend");

app.UseMiddleware<RequestLoggingMiddleware>();

//Authentication then Authorization
app.UseAuthentication();
app.UseAuthorization();


app.MapControllers();





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

//seed test data on application startup (Development only)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var env = services.GetRequiredService<IWebHostEnvironment>();

        await TestDataSeeder.SeedTestDataAsync(context, userManager, logger, env);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error happened while seeding test data");
    }
}

app.Run();
