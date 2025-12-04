using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerRoute.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddReviewRequestJobIdToSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ReviewRequestJobId",
                table: "Sessions",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReviewRequestJobId",
                table: "Sessions");
        }
    }
}
