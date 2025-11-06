using CareerRoute.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Infrastructure.Data.Configurations
{
    public class MentorConfiguration : IEntityTypeConfiguration<Mentor>
    {
        public void Configure(EntityTypeBuilder<Mentor> builder)
        {
            builder.ToTable("Mentors", t =>
            {
                t.HasCheckConstraint("CK_Mentor_AverageRating", "[AverageRating] >= 0 AND [AverageRating] <= 5");
                t.HasCheckConstraint("CK_Mentor_Rate30Min", "[Rate30Min] > 0");
                t.HasCheckConstraint("CK_Mentor_Rate60Min", "[Rate60Min] > 0");
                t.HasCheckConstraint("CK_Mentor_YearsOfExperience", "[YearsOfExperience] >= 0");
            });

            builder.HasOne(m => m.User)
                   .WithOne()
                   .HasForeignKey<Mentor>(m => m.Id)
                   .OnDelete(DeleteBehavior.Cascade);
            
            builder.HasMany(m => m.MentorCategories)
                   .WithOne(mc => mc.Mentor)
                   .HasForeignKey(mc => mc.MentorId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.Property(m => m.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            builder.HasIndex(m => new { m.IsVerified, m.ApprovalStatus })
                .HasDatabaseName("IX_Mentors_IsVerified_ApprovalStatus");

            builder.HasIndex(m => m.AverageRating)
                .HasDatabaseName("IX_Mentors_AverageRating");

            builder.HasIndex(m => m.TotalSessionsCompleted)
                .HasDatabaseName("IX_Mentors_TotalSessionsCompleted");
        }
    }
}
