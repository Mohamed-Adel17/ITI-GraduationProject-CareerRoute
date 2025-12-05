using CareerRoute.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CareerRoute.Infrastructure.Data.Configurations
{
    public class SessionDisputeConfiguration : IEntityTypeConfiguration<SessionDispute>
    {
        public void Configure(EntityTypeBuilder<SessionDispute> builder)
        {
            builder.HasKey(d => d.Id);

            builder.Property(d => d.SessionId)
                .IsRequired()
                .HasMaxLength(450);

            builder.Property(d => d.MenteeId)
                .IsRequired()
                .HasMaxLength(450);

            builder.Property(d => d.Reason)
                .HasConversion<string>()
                .IsRequired();

            builder.Property(d => d.Status)
                .HasConversion<string>()
                .IsRequired();

            builder.Property(d => d.Resolution)
                .HasConversion<string>();

            builder.Property(d => d.Description)
                .HasMaxLength(1000);

            builder.Property(d => d.AdminNotes)
                .HasMaxLength(1000);

            builder.Property(d => d.RefundAmount)
                .HasPrecision(18, 2);

            builder.Property(d => d.CreatedAt)
                .IsRequired();

            // Relationships
            builder.HasOne(d => d.Session)
                .WithOne()
                .HasForeignKey<SessionDispute>(d => d.SessionId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(d => d.Mentee)
                .WithMany()
                .HasForeignKey(d => d.MenteeId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(d => d.ResolvedBy)
                .WithMany()
                .HasForeignKey(d => d.ResolvedById)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes
            builder.HasIndex(d => d.SessionId)
                .IsUnique()
                .HasDatabaseName("IX_SessionDispute_SessionId");

            builder.HasIndex(d => d.Status)
                .HasDatabaseName("IX_SessionDispute_Status");

            builder.HasIndex(d => d.MenteeId)
                .HasDatabaseName("IX_SessionDispute_MenteeId");
        }
    }
}
