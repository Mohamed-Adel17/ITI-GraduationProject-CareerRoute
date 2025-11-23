using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerRoute.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class FixNewColumnName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastTranscriptRetrievalAttempt",
                table: "Sessions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TranscriptRetrievalAttempts",
                table: "Sessions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ZoomMeetingPassword",
                table: "Sessions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastTranscriptRetrievalAttempt",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "TranscriptRetrievalAttempts",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "ZoomMeetingPassword",
                table: "Sessions");
        }
    }
}
