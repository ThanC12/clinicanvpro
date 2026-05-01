using ClinicaProNV.Domain.Billing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ClinicaProNV.Infrastructure.Persistence.Configurations;

public class ClinicInvoiceDetailConfiguration : IEntityTypeConfiguration<ClinicInvoiceDetail>
{
    public void Configure(EntityTypeBuilder<ClinicInvoiceDetail> builder)
    {
        builder.ToTable("ClinicInvoiceDetails");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ClinicInvoiceId)
            .IsRequired();

        builder.Property(x => x.Description)
            .IsRequired();

        builder.Property(x => x.Quantity)
            .IsRequired();

        builder.Property(x => x.UnitPrice)
            .HasColumnType("numeric")
            .IsRequired();

        builder.Property(x => x.LineTotal)
            .HasColumnType("numeric")
            .IsRequired();

        builder.Property(x => x.CreatedAtUtc)
            .IsRequired();
    }
}