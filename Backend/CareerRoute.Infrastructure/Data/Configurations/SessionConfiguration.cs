using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CareerRoute.Infrastructure.Data.Configurations
{
    public class SessionConfiguration : IEntityTypeConfiguration<Session>
    {
        public void Configure(EntityTypeBuilder<Session> builder)
        {
            builder.ToTable("Sessions", t =>
            {
                t.HasCheckConstraint("CK_Session_Price", "[Price] > 0");
            });

            // Primary Key
            builder.HasKey(s => s.Id);

            // Properties
            builder.Property(s => s.MenteeId)
                .IsRequired()
                .HasMaxLength(450);

            builder.Property(s => s.MentorId)
                .IsRequired()
                .HasMaxLength(450);

            builder.Property(s => s.TimeSlotId)
                .IsRequired(false) // Nullable for backward compatibility
                .HasMaxLength(450);

            builder.Property(s => s.PaymentId)
                .IsRequired(false); // Nullable

            // Enum conversions to string
            builder.Property(s => s.SessionType)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            builder.Property(s => s.Duration)
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            builder.Property(s => s.Status)
                .HasConversion<string>()
                .HasMaxLength(30)
                .IsRequired();

            builder.Property(s => s.ScheduledStartTime)
                .IsRequired();

            builder.Property(s => s.ScheduledEndTime)
                .IsRequired();

            builder.Property(s => s.VideoConferenceLink)
                .HasMaxLength(500);

            builder.Property(s => s.Topic)
                .HasMaxLength(200);

            builder.Property(s => s.Notes)
                .HasMaxLength(1000);

            builder.Property(s => s.Price)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            builder.Property(s => s.CancellationReason)
                .HasMaxLength(500);

            builder.Property(s => s.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Relationship: Session has one Mentee
            builder.HasOne(s => s.Mentee)
                .WithMany()
                .HasForeignKey(s => s.MenteeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relationship: Session belongs to one Mentor
            builder.HasOne(s => s.Mentor)
                .WithMany()
                .HasForeignKey(s => s.MentorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relationship: Session optionally linked to TimeSlot (configured in TimeSlotConfiguration)

            // Indexes for performance
            builder.HasIndex(s => new { s.MentorId, s.ScheduledStartTime })
                .HasDatabaseName("IX_Sessions_MentorId_ScheduledStartTime");

            builder.HasIndex(s => new { s.MenteeId, s.ScheduledStartTime })
                .HasDatabaseName("IX_Sessions_MenteeId_ScheduledStartTime");

            builder.HasIndex(s => s.Status)
                .HasDatabaseName("IX_Sessions_Status");
        }
    }
}
