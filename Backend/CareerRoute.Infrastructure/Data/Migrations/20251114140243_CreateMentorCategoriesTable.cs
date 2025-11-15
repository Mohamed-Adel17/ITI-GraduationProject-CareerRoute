using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerRoute.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class CreateMentorCategoriesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MentorCategory_Categories_CategoryId",
                table: "MentorCategory");

            migrationBuilder.DropForeignKey(
                name: "FK_MentorCategory_Mentors_MentorId",
                table: "MentorCategory");

            migrationBuilder.DropPrimaryKey(
                name: "PK_MentorCategory",
                table: "MentorCategory");

            migrationBuilder.RenameTable(
                name: "MentorCategory",
                newName: "MentorCategories");

            migrationBuilder.RenameIndex(
                name: "IX_MentorCategory_CategoryId",
                table: "MentorCategories",
                newName: "IX_MentorCategories_CategoryId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_MentorCategories",
                table: "MentorCategories",
                columns: new[] { "MentorId", "CategoryId" });

            migrationBuilder.AddForeignKey(
                name: "FK_MentorCategories_Categories_CategoryId",
                table: "MentorCategories",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MentorCategories_Mentors_MentorId",
                table: "MentorCategories",
                column: "MentorId",
                principalTable: "Mentors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MentorCategories_Categories_CategoryId",
                table: "MentorCategories");

            migrationBuilder.DropForeignKey(
                name: "FK_MentorCategories_Mentors_MentorId",
                table: "MentorCategories");

            migrationBuilder.DropPrimaryKey(
                name: "PK_MentorCategories",
                table: "MentorCategories");

            migrationBuilder.RenameTable(
                name: "MentorCategories",
                newName: "MentorCategory");

            migrationBuilder.RenameIndex(
                name: "IX_MentorCategories_CategoryId",
                table: "MentorCategory",
                newName: "IX_MentorCategory_CategoryId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_MentorCategory",
                table: "MentorCategory",
                columns: new[] { "MentorId", "CategoryId" });

            migrationBuilder.AddForeignKey(
                name: "FK_MentorCategory_Categories_CategoryId",
                table: "MentorCategory",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MentorCategory_Mentors_MentorId",
                table: "MentorCategory",
                column: "MentorId",
                principalTable: "Mentors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
