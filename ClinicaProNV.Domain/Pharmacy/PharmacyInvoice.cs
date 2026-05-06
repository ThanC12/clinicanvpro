using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Pharmacy;

public class PharmacyInvoice : BaseEntity
{
    public Guid? PatientId { get; private set; }
    public string CustomerName { get; private set; } = string.Empty;
    public string CustomerIdentification { get; private set; } = string.Empty;
    public string CustomerPhone { get; private set; } = string.Empty;
    public decimal Total { get; private set; }

    public bool IsDeleted { get; private set; }

    public DateTime? DeletedAtUtc { get; private set; }

    public Guid? DeletedByUserId { get; private set; }

    public string DeletedByEmail { get; private set; } = string.Empty;

    public string DeletionReason { get; private set; } = string.Empty;

    private readonly List<PharmacyInvoiceDetail> _details = new();
    public IReadOnlyCollection<PharmacyInvoiceDetail> Details => _details;

    protected PharmacyInvoice() { }

    public PharmacyInvoice(
        Guid? patientId,
        string customerName,
        string customerIdentification,
        string customerPhone = "")
    {
        if (patientId is null && string.IsNullOrWhiteSpace(customerName))
        {
            throw new ArgumentException("El nombre del cliente es obligatorio para ventas externas.", nameof(customerName));
        }

        PatientId = patientId;
        CustomerName = string.IsNullOrWhiteSpace(customerName) ? string.Empty : customerName.Trim();
        CustomerIdentification = string.IsNullOrWhiteSpace(customerIdentification) ? string.Empty : customerIdentification.Trim();
        CustomerPhone = string.IsNullOrWhiteSpace(customerPhone) ? string.Empty : customerPhone.Trim();
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
