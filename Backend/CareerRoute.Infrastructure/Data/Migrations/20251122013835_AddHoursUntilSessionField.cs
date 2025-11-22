using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerRoute.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddHoursUntilSessionField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CancellationReason",
                table: "CancelSession",
                newName: "CancelationReason");

            migrationBuilder.AddColumn<int>(
                name: "HoursUntilSession",
                table: "Sessions",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HoursUntilSession",
                table: "Sessions");

            migrationBuilder.RenameColumn(
                name: "CancelationReason",
                table: "CancelSession",
                newName: "CancellationReason");
        }
    }
}
