using ClinicaProNV.Domain.Billing;

namespace ClinicaProNV.Application.UseCases.Billing;

public class CreateClinicInvoiceUseCase
{
    public ClinicInvoice Execute(Guid patientId, decimal total)
    {
        return new ClinicInvoice(patientId, total);
    }
}