using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Pharmacy;

public class PharmacyInvoice : BaseEntity
{
    public Guid PatientId { get; private set; }
    public decimal Total { get; private set; }

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
}
