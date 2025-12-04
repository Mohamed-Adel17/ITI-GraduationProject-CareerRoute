using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerRoute.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAIPreparationFieldsToSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AIPreparationGeneratedAt",
                table: "Sessions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AIPreparationGuide",
                table: "Sessions",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AIPreparationGeneratedAt",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "AIPreparationGuide",
                table: "Sessions");
        }
    }
}
