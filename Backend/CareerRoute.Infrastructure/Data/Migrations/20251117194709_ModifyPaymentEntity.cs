using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CareerRoute.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class ModifyPaymentEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProviderSignature",
                table: "Payments");

            migrationBuilder.AlterColumn<string>(
                name: "PaymentIntentId",
                table: "Payments",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "MenteeId",
                table: "Payments",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "PaidAt",
                table: "Payments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PaymobPaymentMethod",
                table: "Payments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Pament_PaymentIntentId",
                table: "Payments",
                column: "PaymentIntentId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_MenteeId",
                table: "Payments",
                column: "MenteeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_AspNetUsers_MenteeId",
                table: "Payments",
                column: "MenteeId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_AspNetUsers_MenteeId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Pament_PaymentIntentId",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_MenteeId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "MenteeId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "PaidAt",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "PaymobPaymentMethod",
                table: "Payments");

            migrationBuilder.AlterColumn<string>(
                name: "PaymentIntentId",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AddColumn<string>(
                name: "ProviderSignature",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
