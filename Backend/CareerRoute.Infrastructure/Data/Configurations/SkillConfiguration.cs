using CareerRoute.Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CareerRoute.Infrastructure.Data.Configurations
{
    public class SkillConfiguration : IEntityTypeConfiguration<Skill>
    {
        public void Configure(EntityTypeBuilder<Skill> builder)
        {
            builder.ToTable("Skills", t =>
            {
                t.HasCheckConstraint("CK_Skill_Name_NotEmpty", "LEN([Name]) > 0");
            });

            // Primary Key
            builder.HasKey(s => s.Id);

            // Properties
            builder.Property(s => s.Name)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(s => s.CategoryId)
                .IsRequired();

            builder.Property(s => s.IsActive)
                .IsRequired()
                .HasDefaultValue(true);

            builder.Property(s => s.CreatedAt)
                .HasDefaultValueSql("GETUTCDATE()");

            // Unique constraint: Skill name must be unique within a category
            builder.HasIndex(s => new { s.Name, s.CategoryId })
                .IsUnique()
                .HasDatabaseName("IX_Skills_Name_CategoryId");

            // Index on IsActive for filtering
            builder.HasIndex(s => s.IsActive)
                .HasDatabaseName("IX_Skills_IsActive");

            // Relationship: Skill belongs to one Category
            builder.HasOne(s => s.Category)
                .WithMany(c => c.Skills)
                .HasForeignKey(s => s.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relationship: Skill has many UserSkills
            builder.HasMany(s => s.UserSkills)
                .WithOne(us => us.Skill)
                .HasForeignKey(us => us.SkillId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
