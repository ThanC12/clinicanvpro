using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClinicaProNV.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoiceDeletionAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAtUtc",
                table: "PharmacyInvoices",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedByEmail",
                table: "PharmacyInvoices",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "PharmacyInvoices",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletionReason",
                table: "PharmacyInvoices",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "PharmacyInvoices",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAtUtc",
                table: "ClinicInvoices",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletedByEmail",
                table: "ClinicInvoices",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedByUserId",
                table: "ClinicInvoices",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeletionReason",
                table: "ClinicInvoices",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ClinicInvoices",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "InvoiceDeletionLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InvoiceType = table.Column<string>(type: "text", nullable: false),
                    InvoiceId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientId = table.Column<Guid>(type: "uuid", nullable: false),
                    PatientName = table.Column<string>(type: "text", nullable: false),
                    Total = table.Column<decimal>(type: "numeric", nullable: false),
                    DeletedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    DeletedByEmail = table.Column<string>(type: "text", nullable: false),
                    Reason = table.Column<string>(type: "text", nullable: false),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvoiceDeletionLogs", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InvoiceDeletionLogs");

            migrationBuilder.DropColumn(
                name: "DeletedAtUtc",
                table: "PharmacyInvoices");

            migrationBuilder.DropColumn(
                name: "DeletedByEmail",
                table: "PharmacyInvoices");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "PharmacyInvoices");

            migrationBuilder.DropColumn(
                name: "DeletionReason",
                table: "PharmacyInvoices");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "PharmacyInvoices");

            migrationBuilder.DropColumn(
                name: "DeletedAtUtc",
                table: "ClinicInvoices");

            migrationBuilder.DropColumn(
                name: "DeletedByEmail",
                table: "ClinicInvoices");

            migrationBuilder.DropColumn(
                name: "DeletedByUserId",
                table: "ClinicInvoices");

            migrationBuilder.DropColumn(
                name: "DeletionReason",
                table: "ClinicInvoices");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ClinicInvoices");
        }
    }
}
