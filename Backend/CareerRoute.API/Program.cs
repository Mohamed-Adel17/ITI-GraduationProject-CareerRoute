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
var frontendUrl = builder.Configuration["FrontendUrl"] ?? "http://localhost:4200";

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(frontendUrl).AllowAnyMethod().AllowAnyHeader().AllowCredentials();
    });
});

// Add services to the container.
// Clean Architecture Layers
builder.Services.AddCore();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddConfigurationInfrastructure(builder.Configuration);


builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    //options.User.RequireUniqueEmail = true; // Ensure unique email addresses
})
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

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
        policy=> policy.RequireRole(AppRoles.User));
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
    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
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
    catch(Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error happened while seeding roles");
    }
}

app.Run();
