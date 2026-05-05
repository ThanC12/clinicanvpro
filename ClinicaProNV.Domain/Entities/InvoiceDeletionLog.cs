using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Entities;

public class InvoiceDeletionLog : BaseEntity
{
    public string InvoiceType { get; private set; } = string.Empty;
    public Guid InvoiceId { get; private set; }
    public Guid PatientId { get; private set; }
    public string PatientName { get; private set; } = string.Empty;
    public decimal Total { get; private set; }
    public Guid DeletedByUserId { get; private set; }
    public string DeletedByEmail { get; private set; } = string.Empty;
    public string Reason { get; private set; } = string.Empty;
    public DateTime DeletedAtUtc { get; private set; }

    protected InvoiceDeletionLog()
    {
    }

    public InvoiceDeletionLog(
        string invoiceType,
        Guid invoiceId,
        Guid patientId,
        string patientName,
        decimal total,
        Guid deletedByUserId,
        string deletedByEmail,
        string reason)
    {
        if (string.IsNullOrWhiteSpace(invoiceType))
        {
            throw new ArgumentException("El tipo de factura es obligatorio.", nameof(invoiceType));
        }

        if (invoiceId == Guid.Empty)
        {
            throw new ArgumentException("La factura es obligatoria.", nameof(invoiceId));
        }

        if (patientId == Guid.Empty)
        {
            throw new ArgumentException("El paciente es obligatorio.", nameof(patientId));
        }

        if (deletedByUserId == Guid.Empty)
        {
            throw new ArgumentException("El usuario que anula la factura es obligatorio.", nameof(deletedByUserId));
        }

        InvoiceType = invoiceType.Trim();
        InvoiceId = invoiceId;
        PatientId = patientId;
        PatientName = string.IsNullOrWhiteSpace(patientName) ? "Sin nombre" : patientName.Trim();
        Total = total;
        DeletedByUserId = deletedByUserId;
        DeletedByEmail = string.IsNullOrWhiteSpace(deletedByEmail) ? "Desconocido" : deletedByEmail.Trim();
        Reason = string.IsNullOrWhiteSpace(reason) ? "Sin motivo" : reason.Trim();
        DeletedAtUtc = DateTime.UtcNow;
    }
}
