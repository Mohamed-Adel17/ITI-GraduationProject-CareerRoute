using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerRoute.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddZoomIntegrationFieldsToSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RecordingAvailableAt",
                table: "Sessions",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecordingPlayUrl",
                table: "Sessions",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "RecordingProcessed",
                table: "Sessions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Transcript",
                table: "Sessions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TranscriptProcessed",
                table: "Sessions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<long>(
                name: "ZoomMeetingId",
                table: "Sessions",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_ZoomMeetingId",
                table: "Sessions",
                column: "ZoomMeetingId");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_RecordingProcessed",
                table: "Sessions",
                column: "RecordingProcessed");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Sessions_RecordingProcessed",
                table: "Sessions");

            migrationBuilder.DropIndex(
                name: "IX_Sessions_ZoomMeetingId",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "RecordingAvailableAt",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "RecordingPlayUrl",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "RecordingProcessed",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "Transcript",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "TranscriptProcessed",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "ZoomMeetingId",
                table: "Sessions");
        }
    }
}
