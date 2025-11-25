using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CareerRoute.Infrastructure.Data.SeedData
{
    public static class TestDataSeeder
    {
        public static async Task SeedTestDataAsync(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger logger,
            IWebHostEnvironment env)
        {
            // Only seed test data in Development environment
            if (!env.IsDevelopment())
            {
                logger.LogInformation("Skipping test data seeding (not in Development environment)");
                return;
            }

            logger.LogInformation("=== Starting Test Data Seeding for US2 ===");

            try
            {
                // Check each component independently and seed what's missing
                
                // Step 0: Seed Admin User
                var adminExists = await userManager.Users
                    .AnyAsync(u => u.Email == "admin@careerroute.com");
                
                if (!adminExists)
                {
                    logger.LogInformation("Step 0: Seeding admin user...");
                    await SeedAdminUserAsync(userManager, logger);
                }
                else
                {
                    logger.LogInformation("Step 0: Admin user already exists, skipping...");
                }
                
                // Step 1: Seed Test Users (mentors and regular users)
                var testUsersExist = await context.Users
                    .AnyAsync(u => u.Email != null && u.Email.EndsWith("@test.com"));
                
                if (!testUsersExist)
                {
                    logger.LogInformation("Step 1: Seeding test users...");
                    await SeedTestUsersAsync(context, userManager, logger);
                }
                else
                {
                    logger.LogInformation("Step 1: Test users already exist, skipping...");
                }

                // Step 2: Seed Test Mentors
                var testMentorsExist = await context.Mentors
                    .AnyAsync(m => m.User.Email != null && m.User.Email.EndsWith("@test.com"));
                
                if (!testMentorsExist)
                {
                    logger.LogInformation("Step 2: Seeding test mentors...");
                    await SeedTestMentorsAsync(context, logger);
                }
                else
                {
                    logger.LogInformation("Step 2: Test mentors already exist, skipping...");
                }

                // Step 3: Seed UserSkills (expertise tags)
                var testUsersMissingSkills = await context.Users
                    .Where(u => u.Email != null && u.Email.EndsWith("@test.com"))
                    .AnyAsync(u => !u.UserSkills.Any());

                if (testUsersMissingSkills)
                {
                    logger.LogInformation("Step 3: Seeding user skills for users missing assigned skills...");
                    await SeedUserSkillsAsync(context, logger);
                }
                else
                {
                    logger.LogInformation("Step 3: All test users already have skills assigned, skipping...");
                }

                // Step 4: Seed MentorCategories
                var mentorCategoriesExist = await context.Set<MentorCategory>()
                    .AnyAsync(mc => mc.Mentor.User.Email != null && mc.Mentor.User.Email.EndsWith("@test.com"));
                
                if (!mentorCategoriesExist)
                {
                    logger.LogInformation("Step 4: Seeding mentor categories...");
                    await SeedMentorCategoriesAsync(context, logger);
                }
                else
                {
                    logger.LogInformation("Step 4: Mentor categories already exist, skipping...");
                }

                // Step 5: Seed TimeSlots
                var timeSlotsExist = await context.TimeSlots
                    .AnyAsync(ts => ts.Mentor.User.Email != null && ts.Mentor.User.Email.EndsWith("@test.com"));
                
                if (!timeSlotsExist)
                {
                    logger.LogInformation("Step 5: Seeding time slots...");
                    await SeedTestTimeSlotsAsync(context, logger);
                }
                else
                {
                    logger.LogInformation("Step 5: Time slots already exist, skipping...");
                }

                logger.LogInformation("=== Test Data Seeding Completed Successfully! ===");
                logger.LogInformation("Admin Login: admin@careerroute.com / Password: Admin@123");
                logger.LogInformation("Test Mentors: mentor1-30@test.com / Password: Test@123");
                logger.LogInformation("Test Users: user1-10@test.com / Password: Test@123");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error occurred during test data seeding");
                throw;
            }
        }

        private static async Task SeedAdminUserAsync(
            UserManager<ApplicationUser> userManager,
            ILogger logger)
        {
            var adminUser = new ApplicationUser
            {
                UserName = "admin@careerroute.com",
                Email = "admin@careerroute.com",
                FirstName = "Admin",
                LastName = "User",
                EmailConfirmed = true,
                IsMentor = false,
                IsActive = true,
                RegistrationDate = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(adminUser, "Admin@123");
            
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
                logger.LogInformation("Admin user created: admin@careerroute.com / Password: Admin@123");
            }
            else
            {
                logger.LogError("Failed to create admin user: {Errors}", 
                    string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }

        private static async Task SeedTestUsersAsync(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            ILogger logger)
        {
            var firstNames = new[] { "Sarah", "Michael", "Emily", "David", "Jennifer", "Robert", "Lisa", "James", "Maria", "John",
                                     "Patricia", "Christopher", "Nancy", "Daniel", "Karen", "Matthew", "Betty", "Anthony", "Helen", "Mark",
                                     "Sandra", "Donald", "Ashley", "Paul", "Donna", "Steven", "Carol", "Andrew", "Michelle", "Joshua" };

            var lastNames = new[] { "Johnson", "Chen", "Rodriguez", "Kim", "Williams", "Martinez", "Brown", "Davis", "Garcia", "Miller",
                                    "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson",
                                    "Garcia", "Robinson", "Clark", "Lewis", "Lee", "Walker", "Hall", "Allen", "Young", "King" };

            var mentorUsers = new List<ApplicationUser>();

            // Create 30 mentor users
            for (int i = 1; i <= 30; i++)
            {
                var user = new ApplicationUser
                {
                    UserName = $"mentor{i}@test.com",
                    Email = $"mentor{i}@test.com",
                    FirstName = firstNames[(i - 1) % firstNames.Length],
                    LastName = lastNames[(i - 1) % lastNames.Length],
                    EmailConfirmed = true,
                    IsMentor = true,
                    RegistrationDate = DateTime.UtcNow.AddDays(-Random.Shared.Next(30, 365)),
                    IsActive = true
                };

                var result = await userManager.CreateAsync(user, "Test@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, "Mentor");
                    mentorUsers.Add(user);
                }
            }

            // Create 10 regular users
            for (int i = 1; i <= 10; i++)
            {
                var user = new ApplicationUser
                {
                    UserName = $"user{i}@test.com",
                    Email = $"user{i}@test.com",
                    FirstName = $"User{i}",
                    LastName = "Test",
                    EmailConfirmed = true,
                    IsMentor = false,
                    RegistrationDate = DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 180)),
                    IsActive = true
                };

                await userManager.CreateAsync(user, "Test@123");
                await userManager.AddToRoleAsync(user, "User");
            }

            logger.LogInformation("Seeded 30 mentor users and 10 regular users (all with password: Test@123)");
        }

        private static async Task SeedTestMentorsAsync(ApplicationDbContext context, ILogger logger)
        {
            // Get all mentor users we just created
            var mentorUsers = await context.Users
                .Where(u => u.Email != null && u.Email.StartsWith("mentor") && u.Email.EndsWith("@test.com"))
                .OrderBy(u => u.Email)
                .ToListAsync();

            var bios = new[]
            {
                "Full-stack developer with 8 years of experience in React, Node.js, and AWS cloud architecture. Specialized in building scalable enterprise applications and mentoring junior developers.",
                "AWS Solutions Architect with 10 years of experience designing cloud infrastructure. Certified in AWS, Azure, and Google Cloud. Helped 50+ companies migrate to cloud.",
                "Career coach specializing in helping professionals navigate career transitions. 12 years of experience in HR and talent development. Expert in interview preparation and personal branding.",
                "Digital marketing expert with 7 years of experience in SEO, content strategy, and social media marketing. Helped 100+ businesses grow their online presence.",
                "Senior engineering manager with 15 years of experience leading high-performing teams. Expert in agile methodologies, project management, and strategic planning.",
                "Financial analyst with CFA certification and 9 years of experience in investment strategy and portfolio management. Specialized in risk management and financial planning.",
                "UX/UI designer with 6 years of experience creating user-centered digital products. Expert in user research, prototyping, and design thinking methodologies.",
                "Python developer specialized in data science and machine learning. 5 years of experience building ML models and data pipelines. Expert in TensorFlow and PyTorch.",
                "HR strategist with 11 years of experience in recruitment, training, and culture building. Helped startups scale from 10 to 500+ employees.",
                "Product manager with 8 years of experience launching successful SaaS products. Expert in product strategy, roadmap planning, and stakeholder management.",
                "Frontend developer specializing in React and modern JavaScript. 6 years of experience building responsive web applications. Passionate about UI/UX best practices.",
                "DevOps engineer with 7 years of experience automating CI/CD pipelines. Expert in Docker, Kubernetes, Jenkins, and infrastructure as code.",
                "Business consultant helping startups with strategic planning and growth strategies. 10 years of experience working with early-stage companies.",
                "Graphic designer with 9 years of experience in brand identity and visual communication. Expert in Adobe Creative Suite and design principles.",
                "Sales strategist with 12 years of experience in B2B sales and business development. Helped companies increase revenue by 200%+.",
                "Backend engineer specializing in Java and microservices architecture. 8 years of experience building distributed systems at scale.",
                "Content strategist with 6 years of experience creating engaging content for brands. Expert in SEO, copywriting, and content marketing.",
                "Angular developer with 5 years of experience building enterprise web applications. Certified Angular developer with strong TypeScript skills.",
                "Leadership coach helping managers transition to executive roles. 14 years of experience in organizational development and executive coaching.",
                "Cybersecurity specialist with 10 years of experience in security architecture and penetration testing. CISSP certified.",
                "Mobile developer specializing in React Native and Flutter. 6 years of experience building cross-platform mobile apps.",
                "Data analyst with 7 years of experience in business intelligence and data visualization. Expert in SQL, Power BI, and Tableau.",
                "Accounting professional with CPA certification and 11 years of experience in financial reporting and tax planning.",
                "Social media manager with 5 years of experience growing brand presence across platforms. Expert in community management and analytics.",
                "Vue.js developer with 4 years of experience building modern SPAs. Strong background in frontend architecture and state management.",
                "Recruiter with 8 years of experience in tech hiring. Expert in sourcing, interviewing, and building employer branding strategies.",
                "Azure cloud architect with 9 years of experience designing enterprise cloud solutions. Microsoft Certified: Azure Solutions Architect Expert.",
                "Email marketing specialist with 6 years of experience in automation and conversion optimization. Expert in Mailchimp, HubSpot, and marketing automation.",
                "System design expert with 12 years of experience architecting large-scale distributed systems. Former tech lead at Fortune 500 companies.",
                "User researcher with 7 years of experience conducting usability studies and user interviews. Expert in qualitative and quantitative research methods."
            };

            var mentors = new List<Mentor>();

            for (int i = 0; i < Math.Min(mentorUsers.Count, 30); i++)
            {
                var user = mentorUsers[i];
                
                // Calculate varied attributes for testing
                var mentorIndex = i + 1;
                
                // Price tiers: Low (1-10), Medium (11-22), High (23-30) - All prices between 100-500
                decimal rate30Min = mentorIndex <= 10 ? Random.Shared.Next(100, 201) :
                                   mentorIndex <= 22 ? Random.Shared.Next(200, 351) :
                                   Random.Shared.Next(350, 501);
                
                decimal rate60Min = rate30Min * 1.7m; // Roughly 70% more for 60min
                
                // Rating tiers: Excellent (1-10), Good (11-20), Average (21-25), Unrated (26-30)
                decimal avgRating = mentorIndex <= 10 ? 4.5m + (Random.Shared.Next(0, 6) / 10m) :
                                   mentorIndex <= 20 ? 4.0m + (Random.Shared.Next(0, 5) / 10m) :
                                   mentorIndex <= 25 ? 3.5m + (Random.Shared.Next(0, 5) / 10m) :
                                   0m;
                
                int totalReviews = avgRating > 0 ? (mentorIndex <= 10 ? Random.Shared.Next(50, 90) :
                                                     mentorIndex <= 20 ? Random.Shared.Next(20, 50) :
                                                     mentorIndex <= 25 ? Random.Shared.Next(10, 25) : 0) : 0;
                
                // Popularity tiers: Very Popular (1-5), Popular (6-15), Moderate (16-25), New (26-30)
                int totalSessions = mentorIndex <= 5 ? Random.Shared.Next(100, 201) :
                                   mentorIndex <= 15 ? Random.Shared.Next(50, 100) :
                                   mentorIndex <= 25 ? Random.Shared.Next(20, 50) :
                                   Random.Shared.Next(0, 6);

                // Most mentors are approved (28), 2 are pending for admin testing
                var approvalStatus = mentorIndex <= 28 ? MentorApprovalStatus.Approved : MentorApprovalStatus.Pending;
                bool isVerified = approvalStatus == MentorApprovalStatus.Approved;

                var mentor = new Mentor
                {
                    Id = user.Id,
                    Bio = bios[i % bios.Length],
                    YearsOfExperience = Random.Shared.Next(4, 16),
                    Certifications = GetCertifications(mentorIndex),
                    Rate30Min = rate30Min,
                    Rate60Min = rate60Min,
                    AverageRating = avgRating,
                    TotalReviews = totalReviews,
                    TotalSessionsCompleted = totalSessions,
                    ApprovalStatus = approvalStatus,
                    IsVerified = isVerified,
                    IsAvailable = isVerified, // Available if verified
                    CreatedAt = DateTime.UtcNow.AddDays(-Random.Shared.Next(30, 365)),
                    UpdatedAt = isVerified ? DateTime.UtcNow.AddDays(-Random.Shared.Next(1, 30)) : null
                };

                mentors.Add(mentor);
            }

            await context.Mentors.AddRangeAsync(mentors);
            await context.SaveChangesAsync();

            logger.LogInformation("Seeded {Count} test mentors (28 Approved, 2 Pending)", mentors.Count);
        }

        private static string? GetCertifications(int mentorIndex)
        {
            var certs = new string?[]
            {
                "AWS Certified Solutions Architect - Professional",
                "Microsoft Certified: Azure Solutions Architect Expert",
                "Google Cloud Professional Cloud Architect",
                "Certified Scrum Master (CSM), PMI-ACP",
                "CFA (Chartered Financial Analyst) Level 3",
                "Certified Public Accountant (CPA)",
                "Meta React Developer Certificate, AWS Developer Associate",
                "PMP (Project Management Professional), Six Sigma Black Belt",
                "Adobe Certified Expert, Certified UX Designer",
                "CISSP (Certified Information Systems Security Professional)",
                null, // Some mentors don't have certifications
                "Salesforce Certified Administrator",
                "Google Analytics Individual Qualification",
                "HubSpot Content Marketing Certification",
                "SHRM-SCP (Senior Certified Professional)"
            };

            return certs[mentorIndex % certs.Length];
        }

        private static async Task SeedUserSkillsAsync(ApplicationDbContext context, ILogger logger)
        {
            // Get all mentor users with their skills
            var mentorUsers = await context.Users
                .Where(u => u.Email != null && u.Email.StartsWith("mentor") && u.Email.EndsWith("@test.com"))
                .Include(u => u.UserSkills)
                .OrderBy(u => u.Email)
                .ToListAsync();

            // Get all regular users with their skills
            var regularUsers = await context.Users
                .Where(u => u.Email != null && u.Email.StartsWith("user") && u.Email.EndsWith("@test.com"))
                .Include(u => u.UserSkills)
                .OrderBy(u => u.Email)
                .ToListAsync();

            // Get all skills
            var skills = await context.Skills
                .ToDictionaryAsync(s => s.Name, s => s.Id, StringComparer.OrdinalIgnoreCase);

            var userSkillsToAdd = new List<UserSkill>();
            var missingSkillNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            int mentorsUpdated = 0;
            int regularUsersUpdated = 0;

            // Define skill sets for each mentor persona
            var mentorSkillSets = new[]
            {
                new[] { "React", "Node.js", "AWS", "TypeScript", "System Design" },
                new[] { "AWS", "Azure", "DevOps", "Docker", "Kubernetes" },
                new[] { "Career Shifting", "Interview Preparation", "Resume Building", "Personal Branding" },
                new[] { "Digital Marketing", "SEO", "Content Strategy", "Social Media Marketing" },
                new[] { "Team Management", "Project Management", "Strategic Planning", "Change Management" },
                new[] { "Financial Analysis", "Investment Strategy", "Risk Management", "Portfolio Management" },
                new[] { "UX/UI Design", "Product Design", "User Research", "Prototyping" },
                new[] { "Python", "System Design", "DevOps", "Docker" },
                new[] { "Recruitment", "Training & Development", "Culture Building", "HR Strategy" },
                new[] { "Project Management", "Strategic Planning", "Decision Making", "Performance Management" },
                new[] { "React", "JavaScript", "TypeScript", "Node.js" },
                new[] { "DevOps", "Docker", "Kubernetes", "AWS", "Azure" },
                new[] { "Strategic Planning", "Executive Coaching", "Change Management" },
                new[] { "Graphic Design", "Brand Management", "Design Thinking" },
                new[] { "Sales Strategy", "Digital Marketing", "Email Marketing" },
                new[] { "Java", "System Design", "AWS", "Docker" },
                new[] { "Content Strategy", "SEO", "Social Media Marketing" },
                new[] { "Angular", "TypeScript", "Node.js", "Azure" },
                new[] { "Team Management", "Executive Coaching", "Performance Management", "Conflict Resolution" },
                new[] { "System Design", "AWS", "Python", "DevOps" },
                new[] { "React", "Vue.js", "JavaScript", "Node.js" },
                new[] { "Financial Analysis", "Accounting", "Financial Planning" },
                new[] { "Accounting", "Financial Planning", "Risk Management" },
                new[] { "Social Media Marketing", "Brand Management", "Content Strategy" },
                new[] { "Vue.js", "JavaScript", "TypeScript" },
                new[] { "Recruitment", "Training & Development", "Employee Relations" },
                new[] { "Azure", "C#", "DevOps", "Docker" },
                new[] { "Email Marketing", "Digital Marketing", "Sales Strategy" },
                new[] { "System Design", "AWS", "Kubernetes", "Docker", "Python" },
                new[] { "User Research", "UX/UI Design", "Prototyping", "Design Thinking" }
            };

            // Define skill sets for regular users (same pattern as mentors)
            var userSkillSets = new[]
            {
                new[] { "React", "Node.js", "AWS", "TypeScript", "System Design" },
                new[] { "AWS", "Azure", "DevOps", "Docker", "Kubernetes" },
                new[] { "Career Shifting", "Interview Preparation", "Resume Building", "Personal Branding" },
                new[] { "Digital Marketing", "SEO", "Content Strategy", "Social Media Marketing" },
                new[] { "Team Management", "Project Management", "Strategic Planning", "Change Management" },
                new[] { "Financial Analysis", "Investment Strategy", "Risk Management", "Portfolio Management" },
                new[] { "UX/UI Design", "Product Design", "User Research", "Prototyping" },
                new[] { "Python", "System Design", "DevOps", "Docker" },
                new[] { "Recruitment", "Training & Development", "Culture Building", "HR Strategy" },
                new[] { "Project Management", "Strategic Planning", "Decision Making", "Performance Management" }
            };

            for (int i = 0; i < mentorUsers.Count; i++)
            {
                var user = mentorUsers[i];
                var skillSet = mentorSkillSets[i % mentorSkillSets.Length];
                AssignSkillsToUser(user, skillSet, isMentor: true);
            }

            // Assign skills to regular users
            for (int i = 0; i < regularUsers.Count; i++)
            {
                var user = regularUsers[i];
                var skillSet = userSkillSets[i % userSkillSets.Length];
                AssignSkillsToUser(user, skillSet, isMentor: false);
            }

            if (userSkillsToAdd.Count == 0)
            {
                logger.LogInformation("All test mentors and users already have the expected career interests. No user skills were added.");
                return;
            }

            await context.UserSkills.AddRangeAsync(userSkillsToAdd);
            await context.SaveChangesAsync();

            logger.LogInformation(
                "Seeded {Total} user-skill relationships ({MentorsUpdated} mentors updated, {RegularsUpdated} regular users updated)",
                userSkillsToAdd.Count,
                mentorsUpdated,
                regularUsersUpdated);

            if (missingSkillNames.Count > 0)
            {
                logger.LogWarning("The following skills were referenced in seed data but not found in the database: {MissingSkills}",
                    string.Join(", ", missingSkillNames));
            }

            void AssignSkillsToUser(ApplicationUser user, string[] skillSet, bool isMentor)
            {
                if (skillSet.Length == 0)
                    return;

                var existingSkillIds = user.UserSkills
                    .Select(us => us.SkillId)
                    .ToHashSet();

                var addedAny = false;

                foreach (var skillName in skillSet)
                {
                    if (!skills.TryGetValue(skillName, out var skillId))
                    {
                        if (missingSkillNames.Add(skillName))
                        {
                            logger.LogWarning(
                                "Skill '{SkillName}' not found while assigning skills to user {UserEmail}",
                                skillName,
                                user.Email ?? user.Id);
                        }
                        continue;
                    }

                    if (existingSkillIds.Contains(skillId))
                        continue;

                    existingSkillIds.Add(skillId);
                    addedAny = true;

                    userSkillsToAdd.Add(new UserSkill
                    {
                        UserId = user.Id,
                        SkillId = skillId,
                        CreatedAt = DateTime.UtcNow
                    });
                }

                if (!addedAny)
                    return;

                if (isMentor)
                {
                    mentorsUpdated++;
                }
                else
                {
                    regularUsersUpdated++;
                }
            }
        }

        private static async Task SeedMentorCategoriesAsync(ApplicationDbContext context, ILogger logger)
        {
            // Get all categories and map by name
            var categories = await context.Categories
                .AsNoTracking()
                .ToDictionaryAsync(c => c.Name, c => c.Id, StringComparer.OrdinalIgnoreCase);

            if (categories.Count == 0)
            {
                logger.LogWarning("No categories found. Cannot seed mentor categories.");
                return;
            }

            // Get all mentors
            var mentors = await context.Mentors
                .Include(m => m.User)
                .Where(m => m.User.Email != null && m.User.Email.EndsWith("@test.com"))
                .OrderBy(m => m.User.Email)
                .ToListAsync();

            // Define category assignments by name (1-2 categories per mentor)
            var mentorCategoryAssignments = new[]
            {
                new[] { "IT Careers", "Leadership" },  // Mentor 1
                new[] { "IT Careers" },                 // Mentor 2
                new[] { "IT Careers", "Leadership" },  // Mentor 3
                new[] { "Marketing" },                  // Mentor 4
                new[] { "Leadership" },                 // Mentor 5
                new[] { "Finance" },                    // Mentor 6
                new[] { "Design" },                     // Mentor 7
                new[] { "IT Careers" },                 // Mentor 8
                new[] { "HR" },                         // Mentor 9
                new[] { "Leadership", "IT Careers" },  // Mentor 10
                new[] { "IT Careers" },                 // Mentor 11
                new[] { "IT Careers" },                 // Mentor 12
                new[] { "Leadership" },                 // Mentor 13
                new[] { "Design" },                     // Mentor 14
                new[] { "Marketing" },                  // Mentor 15
                new[] { "IT Careers" },                 // Mentor 16
                new[] { "Marketing" },                  // Mentor 17
                new[] { "IT Careers" },                 // Mentor 18
                new[] { "Leadership" },                 // Mentor 19
                new[] { "IT Careers" },                 // Mentor 20
                new[] { "IT Careers" },                 // Mentor 21
                new[] { "Finance" },                    // Mentor 22
                new[] { "Finance" },                    // Mentor 23
                new[] { "Marketing" },                  // Mentor 24
                new[] { "IT Careers" },                 // Mentor 25
                new[] { "HR" },                         // Mentor 26
                new[] { "IT Careers" },                 // Mentor 27
                new[] { "Marketing" },                  // Mentor 28
                new[] { "IT Careers" },                 // Mentor 29
                new[] { "Design" }                      // Mentor 30
            };

            var mentorCategories = new List<MentorCategory>();

            for (int i = 0; i < mentors.Count && i < mentorCategoryAssignments.Length; i++)
            {
                var mentor = mentors[i];
                var categoryNames = mentorCategoryAssignments[i];

                foreach (var categoryName in categoryNames)
                {
                    if (categories.ContainsKey(categoryName))
                    {
                        mentorCategories.Add(new MentorCategory
                        {
                            MentorId = mentor.Id,
                            CategoryId = categories[categoryName]
                        });
                    }
                    else
                    {
                        logger.LogWarning("Category '{CategoryName}' not found, skipping for mentor {MentorEmail}", 
                            categoryName, mentor.User.Email);
                    }
                }
            }

            if (mentorCategories.Count == 0)
            {
                logger.LogWarning("No valid mentor-category relationships to seed.");
                return;
            }

            await context.Set<MentorCategory>().AddRangeAsync(mentorCategories);
            await context.SaveChangesAsync();

            logger.LogInformation("Seeded {Count} mentor-category relationships", mentorCategories.Count);
        }

        private static async Task SeedTestTimeSlotsAsync(ApplicationDbContext context, ILogger logger)
        {
            // Get all mentors
            var mentors = await context.Mentors
                .Include(m => m.User)
                .Where(m => m.User.Email != null && m.User.Email.EndsWith("@test.com"))
                .ToListAsync();

            var timeSlots = new List<TimeSlot>();
            var startDate = DateTime.UtcNow.AddDays(1).Date; // Start from tomorrow
            var random = new Random();

            foreach (var mentor in mentors)
            {
                // Generate slots for the next 14 days
                for (int day = 0; day < 14; day++)
                {
                    var currentDate = startDate.AddDays(day);
                    
                    // Skip weekends randomly (some mentors work weekends)
                    if ((currentDate.DayOfWeek == DayOfWeek.Saturday || currentDate.DayOfWeek == DayOfWeek.Sunday) && random.Next(2) == 0)
                    {
                        continue;
                    }

                    // Create 2-5 slots per day
                    int slotsPerDay = random.Next(2, 6);
                    int startHour = random.Next(9, 17); // Between 9 AM and 5 PM

                    for (int i = 0; i < slotsPerDay; i++)
                    {
                        var duration = random.Next(2) == 0 ? 30 : 60;
                        var slotStart = currentDate.AddHours(startHour).AddMinutes(random.Next(0, 2) * 30);
                        
                        // Ensure we don't overlap with previous slot (simple check)
                        if (i > 0)
                        {
                            var lastSlot = timeSlots.LastOrDefault();
                            if (lastSlot != null && lastSlot.StartDateTime.AddMinutes(lastSlot.DurationMinutes) > slotStart)
                            {
                                slotStart = lastSlot.StartDateTime.AddMinutes(lastSlot.DurationMinutes).AddMinutes(15); // 15 min break
                            }
                        }

                        // Ensure 24-hour rule (though starting from tomorrow usually covers it)
                        if (slotStart <= DateTime.UtcNow.AddHours(24))
                        {
                            continue;
                        }

                        // 10% chance of being already booked
                        bool isBooked = random.Next(10) == 0;

                        timeSlots.Add(new TimeSlot
                        {
                            Id = Guid.NewGuid().ToString(),
                            MentorId = mentor.Id,
                            StartDateTime = slotStart,
                            DurationMinutes = duration,
                            IsBooked = isBooked,
                            CreatedAt = DateTime.UtcNow
                        });

                        // Advance start hour for next slot
                        startHour += duration / 60 + 1;
                    }
                }
            }

            if (timeSlots.Count > 0)
            {
                await context.TimeSlots.AddRangeAsync(timeSlots);
                await context.SaveChangesAsync();
                logger.LogInformation("Seeded {Count} time slots for {MentorCount} mentors", timeSlots.Count, mentors.Count);
            }
            else
            {
                logger.LogWarning("No time slots were generated.");
            }
        }
    }
}
