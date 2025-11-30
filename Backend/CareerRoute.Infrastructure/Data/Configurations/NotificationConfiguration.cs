using CareerRoute.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CareerRoute.Infrastructure.Data.Configurations
{
    public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
    {
        public void Configure(EntityTypeBuilder<Notification> builder)
        {
            builder.ToTable("Notifications");

            // Primary Key
            builder.HasKey(n => n.Id);

            // Properties
            builder.Property(n => n.UserId)
                .IsRequired()
                .HasMaxLength(450);

            builder.Property(n => n.Type)
                .HasConversion<string>()
                .HasMaxLength(50)
                .IsRequired();

            builder.Property(n => n.Title)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(n => n.Message)
                .IsRequired()
                .HasMaxLength(1000);

            builder.Property(n => n.IsRead)
                .IsRequired()
                .HasDefaultValue(false);

            builder.Property(n => n.CreatedAt)
                .IsRequired()
                .HasDefaultValueSql("GETUTCDATE()");

            builder.Property(n => n.ActionUrl)
                .HasMaxLength(500);

            // Relationship: Notification belongs to one User
            builder.HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Indexes for efficient queries
            builder.HasIndex(n => new { n.UserId, n.CreatedAt })
                .IsDescending(false, true)
                .HasDatabaseName("IX_Notifications_UserId_CreatedAt");

            builder.HasIndex(n => new { n.UserId, n.IsRead })
                .HasDatabaseName("IX_Notifications_UserId_IsRead");
        }
    }
}
