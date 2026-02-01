using ClinicaProNV.Domain.Billing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ClinicaProNV.Infrastructure.Persistence.Configurations;

public class ClinicInvoiceConfiguration : IEntityTypeConfiguration<ClinicInvoice>
{
    public void Configure(EntityTypeBuilder<ClinicInvoice> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Total).HasPrecision(18,2);
        builder.OwnsMany(x => x.Details);
    }
}
