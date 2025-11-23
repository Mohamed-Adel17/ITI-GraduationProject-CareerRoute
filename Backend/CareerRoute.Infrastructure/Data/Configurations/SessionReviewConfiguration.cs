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
    public class SessionReviewConfiguration : IEntityTypeConfiguration<ReviewSession>
    {
        public void Configure(EntityTypeBuilder<ReviewSession> builder)
        {
            {

                builder.HasKey(r => r.Id);

                builder.HasOne(r => r.Session)
                       .WithOne(s => s.Review)
                       .HasForeignKey<ReviewSession>(r => r.SessionId)
                       .OnDelete(DeleteBehavior.Cascade);
            }
        }
    }
}
