using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerRoute.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRescheduleAndCancel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "TimeSlotId",
                table: "Sessions",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "CancelSession",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CancellationReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CancelledBy = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CancelledAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    Status = table.Column<int>(type: "int", nullable: false),
                    SessionId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RefundAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RefundPercentage = table.Column<int>(type: "int", nullable: false),
                    RefundStatus = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CancelSession", x => x.Id);
                    table.CheckConstraint("CK_Cancelation_Reason_MinLength", "LEN(CancelationReason) >= 10");
                    table.ForeignKey(
                        name: "FK_CancelSession_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RescheduledSessions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    OriginalStartTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NewScheduledStartTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RequestedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReschudelReason = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SessionId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RescheduledSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RescheduledSessions_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CancelSession_SessionId",
                table: "CancelSession",
                column: "SessionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RescheduledSessions_SessionId",
                table: "RescheduledSessions",
                column: "SessionId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CancelSession");

            migrationBuilder.DropTable(
                name: "RescheduledSessions");

            migrationBuilder.AlterColumn<int>(
                name: "TimeSlotId",
                table: "Sessions",
                type: "int",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);
        }
    }
}
