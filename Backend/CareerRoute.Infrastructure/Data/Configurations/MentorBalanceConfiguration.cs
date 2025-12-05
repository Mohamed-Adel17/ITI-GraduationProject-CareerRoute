using CareerRoute.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CareerRoute.Infrastructure.Data.Configurations
{
    /// <summary>
    /// Entity configuration for MentorBalance entity
    /// </summary>
    public class MentorBalanceConfiguration : IEntityTypeConfiguration<MentorBalance>
    {
        public void Configure(EntityTypeBuilder<MentorBalance> builder)
        {
            // Primary Key
            builder.HasKey(mb => mb.MentorId);

            // Decimal precision for balance fields
            builder.Property(mb => mb.AvailableBalance)
                .IsRequired()
                .HasPrecision(18, 2)
                .HasDefaultValue(0);

            builder.Property(mb => mb.PendingBalance)
                .IsRequired()
                .HasPrecision(18, 2)
                .HasDefaultValue(0);

            builder.Property(mb => mb.TotalEarnings)
                .IsRequired()
                .HasPrecision(18, 2)
                .HasDefaultValue(0);

            // Required timestamp fields
            builder.Property(mb => mb.CreatedAt)
                .IsRequired();

            builder.Property(mb => mb.UpdatedAt)
                .IsRequired();

            // -------------------------
            // 1:1 Relationship (Mentor ↔ MentorBalance)
            // MentorBalance is dependent
            // -------------------------
            builder.HasOne(mb => mb.Mentor)
                .WithOne(m => m.Balance)
                .HasForeignKey<MentorBalance>(mb => mb.MentorId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Cascade);  // Delete balance when mentor is deleted

            // -------------------------
            // Indexes
            // -------------------------
            builder.HasIndex(mb => mb.MentorId)
                .IsUnique()
                .HasDatabaseName("IX_MentorBalance_MentorId");
        }
    }
}
