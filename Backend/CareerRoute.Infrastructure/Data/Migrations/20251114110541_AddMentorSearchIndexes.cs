using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerRoute.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMentorSearchIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Note: Some indexes may already exist. Using IF NOT EXISTS to prevent errors.
            
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Mentors_ApprovalStatus_IsVerified' AND object_id = OBJECT_ID('Mentors'))
                BEGIN
                    CREATE NONCLUSTERED INDEX IX_Mentors_ApprovalStatus_IsVerified 
                    ON Mentors (ApprovalStatus, IsVerified);
                    PRINT 'Created index: IX_Mentors_ApprovalStatus_IsVerified';
                END
                ELSE
                    PRINT 'Index IX_Mentors_ApprovalStatus_IsVerified already exists';
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Mentors_IsVerified_IsAvailable' AND object_id = OBJECT_ID('Mentors'))
                BEGIN
                    CREATE NONCLUSTERED INDEX IX_Mentors_IsVerified_IsAvailable 
                    ON Mentors (IsVerified, IsAvailable);
                    PRINT 'Created index: IX_Mentors_IsVerified_IsAvailable';
                END
                ELSE
                    PRINT 'Index IX_Mentors_IsVerified_IsAvailable already exists';
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Mentors_AverageRating' AND object_id = OBJECT_ID('Mentors'))
                BEGIN
                    CREATE NONCLUSTERED INDEX IX_Mentors_AverageRating 
                    ON Mentors (AverageRating);
                    PRINT 'Created index: IX_Mentors_AverageRating';
                END
                ELSE
                    PRINT 'Index IX_Mentors_AverageRating already exists';
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Mentors_Rate30Min' AND object_id = OBJECT_ID('Mentors'))
                BEGIN
                    CREATE NONCLUSTERED INDEX IX_Mentors_Rate30Min 
                    ON Mentors (Rate30Min);
                    PRINT 'Created index: IX_Mentors_Rate30Min';
                END
                ELSE
                    PRINT 'Index IX_Mentors_Rate30Min already exists';
            ");

            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Mentors_TotalSessionsCompleted' AND object_id = OBJECT_ID('Mentors'))
                BEGIN
                    CREATE NONCLUSTERED INDEX IX_Mentors_TotalSessionsCompleted 
                    ON Mentors (TotalSessionsCompleted);
                    PRINT 'Created index: IX_Mentors_TotalSessionsCompleted';
                END
                ELSE
                    PRINT 'Index IX_Mentors_TotalSessionsCompleted already exists';
            ");

            // Note: MentorCategories table index skipped - table will be created in a future migration
            migrationBuilder.Sql(@"
                IF OBJECT_ID('MentorCategories', 'U') IS NOT NULL
                BEGIN
                    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MentorCategories_CategoryId_MentorId' AND object_id = OBJECT_ID('MentorCategories'))
                    BEGIN
                        CREATE NONCLUSTERED INDEX IX_MentorCategories_CategoryId_MentorId 
                        ON MentorCategories (CategoryId, MentorId);
                        PRINT 'Created index: IX_MentorCategories_CategoryId_MentorId';
                    END
                    ELSE
                        PRINT 'Index IX_MentorCategories_CategoryId_MentorId already exists';
                END
                ELSE
                    PRINT 'Skipping MentorCategories index - table does not exist yet';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop indexes in reverse order
            migrationBuilder.DropIndex(
                name: "IX_MentorCategories_CategoryId_MentorId",
                table: "MentorCategories");

            migrationBuilder.DropIndex(
                name: "IX_Mentors_TotalSessionsCompleted",
                table: "Mentors");

            migrationBuilder.DropIndex(
                name: "IX_Mentors_Rate30Min",
                table: "Mentors");

            migrationBuilder.DropIndex(
                name: "IX_Mentors_AverageRating",
                table: "Mentors");

            migrationBuilder.DropIndex(
                name: "IX_Mentors_IsVerified_IsAvailable",
                table: "Mentors");

            migrationBuilder.DropIndex(
                name: "IX_Mentors_ApprovalStatus_IsVerified",
                table: "Mentors");
        }
    }
}
