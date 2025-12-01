using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerRoute.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceVideoContentWithStorageKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VideoContent",
                table: "Sessions");

            migrationBuilder.AddColumn<string>(
                name: "VideoStorageKey",
                table: "Sessions",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VideoStorageKey",
                table: "Sessions");

            migrationBuilder.AddColumn<byte[]>(
                name: "VideoContent",
                table: "Sessions",
                type: "varbinary(max)",
                nullable: true);
        }
    }
}
