using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Pharmacy;

public class PharmacyInvoice : BaseEntity
{
    public Guid PatientId { get; private set; }
    public decimal Total { get; private set; }

    public bool IsDeleted { get; private set; }

    public DateTime? DeletedAtUtc { get; private set; }

    public Guid? DeletedByUserId { get; private set; }

    public string DeletedByEmail { get; private set; } = string.Empty;

    public string DeletionReason { get; private set; } = string.Empty;

    private readonly List<PharmacyInvoiceDetail> _details = new();
    public IReadOnlyCollection<PharmacyInvoiceDetail> Details => _details;

    protected PharmacyInvoice() { }

    public PharmacyInvoice(Guid patientId)
    {
        PatientId = patientId;
        Total = 0;
    }

    public void AddItem(Guid medicineId, int quantity, decimal unitPrice)
    {
        if (quantity <= 0) throw new ArgumentException("Quantity must be > 0", nameof(quantity));
        if (unitPrice <= 0) throw new ArgumentException("UnitPrice must be > 0", nameof(unitPrice));

        var detail = new PharmacyInvoiceDetail(this.Id, medicineId, quantity, unitPrice);
        _details.Add(detail);
        Total += detail.LineTotal;
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
