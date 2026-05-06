using ClinicaProNV.Domain.Pharmacy;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ClinicaProNV.Infrastructure.Persistence.Configurations;

public class PharmacyInvoiceConfiguration : IEntityTypeConfiguration<PharmacyInvoice>
{
    public void Configure(EntityTypeBuilder<PharmacyInvoice> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Total).HasPrecision(18,2);
        builder.Property(x => x.CustomerName).IsRequired();
        builder.Property(x => x.CustomerIdentification).IsRequired();
        builder.Property(x => x.CustomerPhone).IsRequired();
        builder.OwnsMany(x => x.Details);
    }
}
