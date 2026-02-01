using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Pharmacy;

public class PharmacyInvoiceDetail : BaseEntity
{
    public Guid PharmacyInvoiceId { get; private set; }
    public PharmacyInvoice PharmacyInvoice { get; private set; } = default!;

    public Guid MedicineId { get; private set; }
    public int Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }
    public decimal LineTotal { get; private set; }

    protected PharmacyInvoiceDetail() { }

    public PharmacyInvoiceDetail(Guid pharmacyInvoiceId, Guid medicineId, int quantity, decimal unitPrice)
    {
        PharmacyInvoiceId = pharmacyInvoiceId;
        MedicineId = medicineId;
        Quantity = quantity;
        UnitPrice = unitPrice;
        LineTotal = quantity * unitPrice;
    }
}
