using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerRoute.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class OptimizeSessionIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Sessions_MenteeId_ScheduledStartTime",
                table: "Sessions");

            migrationBuilder.DropIndex(
                name: "IX_Sessions_MentorId_ScheduledStartTime",
                table: "Sessions");

            migrationBuilder.DropIndex(
                name: "IX_Sessions_Status",
                table: "Sessions");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_MenteeId_Status_Time",
                table: "Sessions",
                columns: new[] { "MenteeId", "Status", "ScheduledStartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_MentorId_Status_Time",
                table: "Sessions",
                columns: new[] { "MentorId", "Status", "ScheduledStartTime" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Sessions_MenteeId_Status_Time",
                table: "Sessions");

            migrationBuilder.DropIndex(
                name: "IX_Sessions_MentorId_Status_Time",
                table: "Sessions");

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_MenteeId_ScheduledStartTime",
                table: "Sessions",
                columns: new[] { "MenteeId", "ScheduledStartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_MentorId_ScheduledStartTime",
                table: "Sessions",
                columns: new[] { "MentorId", "ScheduledStartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Sessions_Status",
                table: "Sessions",
                column: "Status");
        }
    }
}
