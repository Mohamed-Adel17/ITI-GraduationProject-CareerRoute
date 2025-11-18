using CareerRoute.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CareerRoute.Infrastructure.Data.Configurations
{
    public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
    {
        public void Configure(EntityTypeBuilder<Payment> builder)
        {

            builder.HasKey(p => p.Id);


            builder.Property(p => p.Amount)
                .IsRequired()
                .HasPrecision(18, 2);

            builder.Property(p => p.PlatformCommission)
                .HasPrecision(5, 2);

            builder.Property(p => p.RefundAmount)
                .HasPrecision(18, 2);

            builder.Property(p => p.RefundPercentage)
                .HasPrecision(5, 2);

            // Make Enums Stored as string 
            builder.Property(p => p.PaymentProvider)
                .HasConversion<string>();

            builder.Property(p => p.Status)
                .HasConversion<string>();

            builder.Property(p => p.RefundStatus)
                .HasConversion<string>();

            // -------------------------
            // Required fields
            // -------------------------
            builder.Property(p => p.Currency)
                .HasMaxLength(10)
                .IsRequired();

            builder.Property(p => p.CreatedAt)
                .IsRequired();

            builder.Property(p => p.UpdatedAt)
                .IsRequired();

            // -------------------------
            // 1 : 1 Relationship (Session ↔ Payment)
            // Payment is dependent
            // -------------------------
            builder.HasOne(p => p.Session)
                .WithOne(s => s.Payment)              // Session has ONLY ONE payment
                .HasForeignKey<Payment>(p => p.SessionId)
                .IsRequired()                        // Payment MUST have a Session
                .OnDelete(DeleteBehavior.Restrict);  // Prevent cascade delete


            // -------------------------
            // Indexes
            // -------------------------
            builder.HasIndex(p => p.ProviderTransactionId)
                .HasDatabaseName("IX_Payment_ProviderTransactionId");
            builder.HasIndex(p => p.PaymentIntentId)
                .HasDatabaseName("IX_Pament_PaymentIntentId");

            builder.HasIndex(p => p.SessionId)
                .HasDatabaseName("IX_Payment_SessionId");
        }
    }
}
