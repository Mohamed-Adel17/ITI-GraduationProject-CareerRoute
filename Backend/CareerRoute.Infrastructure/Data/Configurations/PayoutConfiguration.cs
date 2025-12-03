using CareerRoute.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CareerRoute.Infrastructure.Data.Configurations
{
    /// <summary>
    /// Entity configuration for Payout entity
    /// </summary>
    public class PayoutConfiguration : IEntityTypeConfiguration<Payout>
    {
        public void Configure(EntityTypeBuilder<Payout> builder)
        {
            // Primary Key
            builder.HasKey(p => p.Id);

            // Decimal precision for amount field
            builder.Property(p => p.Amount)
                .IsRequired()
                .HasPrecision(18, 2);

            // Store enum as string for better readability in database
            builder.Property(p => p.Status)
                .HasConversion<string>()
                .IsRequired();

            // String length constraints
            builder.Property(p => p.MentorId)
                .IsRequired()
                .HasMaxLength(450);

            builder.Property(p => p.FailureReason)
                .HasMaxLength(500);

            // Required timestamp fields
            builder.Property(p => p.RequestedAt)
                .IsRequired();

            // Optional timestamp fields
            builder.Property(p => p.ProcessedAt)
                .IsRequired(false);

            builder.Property(p => p.CompletedAt)
                .IsRequired(false);

            builder.Property(p => p.CancelledAt)
                .IsRequired(false);

            // -------------------------
            // 1:N Relationship (Mentor ↔ Payouts)
            // Payout is dependent
            // -------------------------
            builder.HasOne(p => p.Mentor)
                .WithMany(m => m.Payouts)
                .HasForeignKey(p => p.MentorId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Restrict);  // Prevent cascade delete to preserve payout history

            // -------------------------
            // Indexes
            // -------------------------
            builder.HasIndex(p => p.MentorId)
                .HasDatabaseName("IX_Payout_MentorId");

            builder.HasIndex(p => p.Status)
                .HasDatabaseName("IX_Payout_Status");

            // Composite index for efficient querying of mentor's payouts by status
            builder.HasIndex(p => new { p.MentorId, p.Status })
                .HasDatabaseName("IX_Payout_MentorId_Status");
        }
    }
}
