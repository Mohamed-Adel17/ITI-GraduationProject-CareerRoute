using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerRoute.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddNewTimeSlotIdToRescheduleSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NewTimeSlotId",
                table: "RescheduledSessions",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RescheduledSessions_NewTimeSlotId",
                table: "RescheduledSessions",
                column: "NewTimeSlotId");

            migrationBuilder.AddForeignKey(
                name: "FK_RescheduledSessions_TimeSlots_NewTimeSlotId",
                table: "RescheduledSessions",
                column: "NewTimeSlotId",
                principalTable: "TimeSlots",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RescheduledSessions_TimeSlots_NewTimeSlotId",
                table: "RescheduledSessions");

            migrationBuilder.DropIndex(
                name: "IX_RescheduledSessions_NewTimeSlotId",
                table: "RescheduledSessions");

            migrationBuilder.DropColumn(
                name: "NewTimeSlotId",
                table: "RescheduledSessions");
        }
    }
}
