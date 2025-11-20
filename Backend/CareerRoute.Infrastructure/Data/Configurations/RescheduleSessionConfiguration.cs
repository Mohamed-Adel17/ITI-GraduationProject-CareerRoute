using CareerRoute.Core.Domain.Entities;
using CareerRoute.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareerRoute.Infrastructure.Data.Configurations
{
    public class RescheduleSessionConfiguration
    {
        public void Configure(EntityTypeBuilder<RescheduleSession> builder)
        {

            builder.ToTable("Sessions", t =>
            {
                t.HasCheckConstraint("CK_Reschedule_Reason_MinLength", "LEN(ReschudelReason) >= 10");
            }); 

            builder.HasKey(r => r.Id);

            builder.Property(r => r.NewScheduledStartTime)
                   .IsRequired();

            builder.Property(r => r.ReschudelReason)
                   .HasMaxLength(500)
                   .IsRequired();


            //Not Sure :) 
            builder.Property(r => r.OriginalStartTime)
                   .IsRequired();

            builder.Property(r => r.RequestedBy)
                   .IsRequired();

            builder.Property(r => r.Status)
                   .IsRequired();


            builder.Property(r => r.Status)
                   .HasConversion<string>();


            builder.HasOne(r => r.Session)
                   .WithOne(s => s.Reschedule)
                   .HasForeignKey<RescheduleSession>(r => r.SessionId)
                   .OnDelete(DeleteBehavior.Cascade);

           
        }
    }
}

