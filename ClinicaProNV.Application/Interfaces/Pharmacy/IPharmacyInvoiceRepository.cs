using ClinicaProNV.Domain.Pharmacy;

namespace ClinicaProNV.Application.Interfaces.Pharmacy;

public interface IPharmacyInvoiceRepository
{
    Task AddAsync(PharmacyInvoice invoice);
}
