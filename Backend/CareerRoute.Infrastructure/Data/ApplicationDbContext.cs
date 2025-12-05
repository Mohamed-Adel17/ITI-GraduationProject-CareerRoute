using CareerRoute.Core.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Emit;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Infrastructure.Data
{
    public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) :
        IdentityDbContext<ApplicationUser>(options)
    {
        public DbSet<Mentor> Mentors { get; set; }
        public DbSet<MentorCategory> MentorCategories { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Skill> Skills { get; set; }
        public DbSet<UserSkill> UserSkills { get; set; }
        public DbSet<TimeSlot> TimeSlots { get; set; }
        public DbSet<Session> Sessions { get; set; }
        public DbSet<ReviewSession> ReviewSessions { get; set;  }
        public DbSet<Payment>Payments { get; set; }
        public DbSet<RescheduleSession> RescheduledSessions { get; set; }
        public DbSet<CancelSession> CancelledSessions { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<MentorBalance> MentorBalances { get; set; }
        public DbSet<Payout> Payouts { get; set; }
        public DbSet<SessionDispute> SessionDisputes { get; set; }


        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.Entity<RefreshToken>().HasOne(rt => rt.User)
                .WithMany(u => u.RefreshTokens).HasForeignKey(rt => rt.UserId);

            builder.Entity<ApplicationUser>(b =>
            {
                b.Property(u => u.CareerGoal)
                    .IsRequired(false) 
                    .HasMaxLength(500);
            });

            // Composite key for MentorCategory junction table
            builder.Entity<MentorCategory>()
                .HasKey(mc => new { mc.MentorId, mc.CategoryId });

            // Composite key for UserSkill junction table
            builder.Entity<UserSkill>()
                .HasKey(us => new { us.UserId, us.SkillId });

            // Automatically applies all IEntityTypeConfiguration classes in the assembly
            builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        }
    }
}
