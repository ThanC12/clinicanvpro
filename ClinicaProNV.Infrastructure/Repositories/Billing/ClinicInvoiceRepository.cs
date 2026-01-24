using System.Threading.Tasks;
using ClinicaProNV.Application.Interfaces.Billing;
using ClinicaProNV.Domain.Billing;
using ClinicaProNV.Infrastructure.Persistence.Context;

namespace ClinicaProNV.Infrastructure.Repositories.Billing;

public class ClinicInvoiceRepository : IClinicInvoiceRepository
{
    private readonly ClinicaProNVDbContext _context;

    public ClinicInvoiceRepository(ClinicaProNVDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(ClinicInvoice invoice)
    {
        _context.ClinicInvoices.Add(invoice);
        await _context.SaveChangesAsync();
    }
}
