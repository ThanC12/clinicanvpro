using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Billing;

public class ClinicInvoice : BaseEntity
{
    public Guid PatientId { get; private set; }

    public decimal Total { get; private set; }

    public bool IsDeleted { get; private set; }

    public DateTime? DeletedAtUtc { get; private set; }

    public Guid? DeletedByUserId { get; private set; }

    public string DeletedByEmail { get; private set; } = string.Empty;

    public string DeletionReason { get; private set; } = string.Empty;

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

    public void MarkDeleted(Guid deletedByUserId, string deletedByEmail, string reason)
    {
        if (IsDeleted)
        {
            return;
        }

        if (deletedByUserId == Guid.Empty)
        {
            throw new ArgumentException("El usuario que anula la factura es obligatorio.", nameof(deletedByUserId));
        }

        IsDeleted = true;
        DeletedAtUtc = DateTime.UtcNow;
        DeletedByUserId = deletedByUserId;
        DeletedByEmail = string.IsNullOrWhiteSpace(deletedByEmail) ? "Desconocido" : deletedByEmail.Trim();
        DeletionReason = string.IsNullOrWhiteSpace(reason) ? "Sin motivo" : reason.Trim();
    }
}
