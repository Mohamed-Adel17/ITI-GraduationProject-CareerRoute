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
    public class CancelSessionConfiguration : IEntityTypeConfiguration<CancelSession>
    {
        public void Configure(EntityTypeBuilder<CancelSession> builder)
        {

            builder.ToTable("CancelSession", t =>
            {
                t.HasCheckConstraint("CK_Cancelation_Reason_MinLength", "LEN(CancelationReason) >= 10");
            });

            // Primary key
            builder.HasKey(c => c.Id);

            builder.Property(c => c.CancellationReason)
                   .IsRequired()
                   .HasMaxLength(500);

            builder.Property(c => c.CancelledBy)
                   .IsRequired()
                   .HasMaxLength(50);

            builder.Property(c => c.CancelledAt)
                   .HasDefaultValueSql("GETUTCDATE()");

            //Not Sure :D

            builder.Property(c => c.Status)
                    .IsRequired();

            builder.Property(c => c.RefundStatus)
                   .IsRequired();

            builder.Property(c => c.RefundAmount)
                   .HasColumnType("decimal(18,2)")
                   .IsRequired();

            builder.Property(c => c.RefundPercentage)
                   .IsRequired();


            builder.HasOne(c => c.Session)
                   .WithOne(s => s.Cancellation)
                   .HasForeignKey<CancelSession>(c => c.SessionId)
                   .OnDelete(DeleteBehavior.Cascade)
                   .IsRequired();
        }
    }

}

