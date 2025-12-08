using CareerRoute.Core.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

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
        public DbSet<ReviewSession> ReviewSessions { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<RescheduleSession> RescheduledSessions { get; set; }
        public DbSet<CancelSession> CancelledSessions { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<MentorBalance> MentorBalances { get; set; }
        public DbSet<Payout> Payouts { get; set; }
        public DbSet<SessionDispute> SessionDisputes { get; set; }
        public DbSet<PreviousWork> PreviousWorks { get; set; }

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

            builder.Entity<MentorCategory>()
                .HasKey(mc => new { mc.MentorId, mc.CategoryId });

            builder.Entity<UserSkill>()
                .HasKey(us => new { us.UserId, us.SkillId });

            builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        }
    }
}
