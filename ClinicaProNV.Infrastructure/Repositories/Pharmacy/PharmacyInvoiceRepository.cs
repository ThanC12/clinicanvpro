using System.Threading.Tasks;
using ClinicaProNV.Application.Interfaces.Pharmacy;
using ClinicaProNV.Domain.Pharmacy;
using ClinicaProNV.Infrastructure.Persistence.Context;

namespace ClinicaProNV.Infrastructure.Repositories.Pharmacy;

public class PharmacyInvoiceRepository : IPharmacyInvoiceRepository
{
    private readonly ClinicaProNVDbContext _context;

    public PharmacyInvoiceRepository(ClinicaProNVDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(PharmacyInvoice invoice)
    {
        _context.PharmacyInvoices.Add(invoice);
        await _context.SaveChangesAsync();
    }
}
