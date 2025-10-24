using CareerRoute.Core.Constants;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Infrastructure.Data.SeedData
{
    public static class RoleSeeder
    {
        public static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager, ILogger logger)
        {
            logger.LogInformation("Starting role seeding...");
            foreach(var roleName in AppRoles.GetAllRoles())
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    logger.LogInformation($"Creating role : {roleName}");
                    var result = await roleManager.CreateAsync(new IdentityRole(roleName));

                    if (result.Succeeded)
                    {
                        logger.LogInformation($"Role {roleName} is created successfully");
                    }else
                    {
                        logger.LogError($"Failed to create role '{roleName}': {string.Join(", ", result.Errors.Select(e => e.Description))}");
                    }


                }else
                {
                    logger.LogInformation($"{roleName} already exists");
                }
            }
            logger.LogInformation("Seeding completed");
        }
    }
}
