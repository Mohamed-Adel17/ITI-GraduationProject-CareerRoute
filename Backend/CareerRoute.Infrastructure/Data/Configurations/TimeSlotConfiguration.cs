using CareerRoute.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CareerRoute.Infrastructure.Data.Configurations
{
    public class TimeSlotConfiguration : IEntityTypeConfiguration<TimeSlot>
    {
        public void Configure(EntityTypeBuilder<TimeSlot> builder)
        {
            builder.ToTable("TimeSlots", t =>
            {
                t.HasCheckConstraint("CK_TimeSlot_DurationMinutes", "[DurationMinutes] IN (30, 60)");
            });

            // Primary Key
            builder.HasKey(ts => ts.Id);

            // Properties
            builder.Property(ts => ts.MentorId)
                .IsRequired()
                .HasMaxLength(450);

            builder.Property(ts => ts.SessionId)
                .IsRequired(false); // Nullable

            builder.Property(ts => ts.StartDateTime)
                .IsRequired();

            builder.Property(ts => ts.DurationMinutes)
                .IsRequired();

            builder.Property(ts => ts.IsBooked)
                .IsRequired()
                .HasDefaultValue(false);

            builder.Property(ts => ts.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Relationship: TimeSlot belongs to one Mentor
            builder.HasOne(ts => ts.Mentor)
                .WithMany(m => m.TimeSlots)
                .HasForeignKey(ts => ts.MentorId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relationship: TimeSlot optionally belongs to one Session
            builder.HasOne(ts => ts.Session)
                .WithOne(s => s.TimeSlot)
                .HasForeignKey<TimeSlot>(ts => ts.SessionId)
                .OnDelete(DeleteBehavior.SetNull);

            // Indexes for performance
            builder.HasIndex(ts => new { ts.MentorId, ts.StartDateTime })
                .HasDatabaseName("IX_TimeSlots_MentorId_StartDateTime");

            builder.HasIndex(ts => ts.IsBooked)
                .HasDatabaseName("IX_TimeSlots_IsBooked");

            builder.HasIndex(ts => ts.SessionId)
                .HasDatabaseName("IX_TimeSlots_SessionId");
        }
    }
}
