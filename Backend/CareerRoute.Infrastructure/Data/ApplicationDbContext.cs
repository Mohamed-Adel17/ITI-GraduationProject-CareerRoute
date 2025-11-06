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
        public DbSet<RefreshToken> RefreshTokens { get; set; }
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

                b.Property(u => u.CareerInterst)
                    .IsRequired(false) 
                    .HasMaxLength(500);
            });

            // Automatically applies all IEntityTypeConfiguration classes in the assembly
            builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        }
    }
}
