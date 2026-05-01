using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Billing;

public class ClinicInvoice : BaseEntity
{
    public Guid PatientId { get; private set; }

    public decimal Total { get; private set; }

    protected ClinicInvoice()
    {
    }

    public ClinicInvoice(Guid patientId, decimal total)
    {
        if (patientId == Guid.Empty)
        {
            throw new ArgumentException("El paciente es obligatorio.", nameof(patientId));
        }

        if (total < 0)
        {
            throw new ArgumentException("El total no puede ser negativo.", nameof(total));
        }

        PatientId = patientId;
        Total = total;
    }
}