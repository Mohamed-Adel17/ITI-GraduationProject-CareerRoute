
using CareerRoute.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CareerRoute.Infrastructure.Data.Configurations
{
    public class CategoryConfiguration : IEntityTypeConfiguration<Category>
    {
        public void Configure(EntityTypeBuilder<Category> builder)
        {

            builder.ToTable("Categories", t =>
            {
                t.HasCheckConstraint("CK_Category_Name_NotEmpty", "LEN([Name]) > 0");
            });
            builder.Property(c => c.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");
            builder.HasIndex(c => c.IsActive)
                .HasDatabaseName("IX_Categories_IsActive");
            builder.HasIndex(m => m.Name)
                .IsUnique()
                .HasDatabaseName("IX_Categories_Name");
            builder.HasMany(c => c.MentorCategories)
                .WithOne(mc => mc.Category)
                .HasForeignKey(mc => mc.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(c => c.Skills)
                .WithOne(s => s.Category)
                .HasForeignKey(s => s.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        }

    }
}
