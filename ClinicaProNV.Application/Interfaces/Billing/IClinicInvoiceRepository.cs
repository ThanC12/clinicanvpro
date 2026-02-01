using ClinicaProNV.Domain.Billing;

namespace ClinicaProNV.Application.Interfaces.Billing;

public interface IClinicInvoiceRepository
{
    Task AddAsync(ClinicInvoice invoice);
}
