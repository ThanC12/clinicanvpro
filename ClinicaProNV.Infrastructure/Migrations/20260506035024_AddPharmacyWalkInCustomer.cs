using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicaProNV.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPharmacyWalkInCustomer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "PatientId",
                table: "PharmacyInvoices",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "CustomerIdentification",
                table: "PharmacyInvoices",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CustomerName",
                table: "PharmacyInvoices",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CustomerPhone",
                table: "PharmacyInvoices",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomerIdentification",
                table: "PharmacyInvoices");

            migrationBuilder.DropColumn(
                name: "CustomerName",
                table: "PharmacyInvoices");

            migrationBuilder.DropColumn(
                name: "CustomerPhone",
                table: "PharmacyInvoices");

            migrationBuilder.AlterColumn<Guid>(
                name: "PatientId",
                table: "PharmacyInvoices",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
