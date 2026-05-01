using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Billing;

public class ClinicInvoiceDetail : BaseEntity
{
    public Guid ClinicInvoiceId { get; private set; }

    public string Description { get; private set; } = string.Empty;

    public int Quantity { get; private set; }

    public decimal UnitPrice { get; private set; }

    public decimal LineTotal { get; private set; }

    protected ClinicInvoiceDetail()
    {
    }

    public ClinicInvoiceDetail(
        Guid clinicInvoiceId,
        string description,
        int quantity,
        decimal unitPrice)
    {
        if (clinicInvoiceId == Guid.Empty)
        {
            throw new ArgumentException("La factura es obligatoria.", nameof(clinicInvoiceId));
        }

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new ArgumentException("La descripción es obligatoria.", nameof(description));
        }

        if (quantity <= 0)
        {
            throw new ArgumentException("La cantidad debe ser mayor a cero.", nameof(quantity));
        }

        if (unitPrice <= 0)
        {
            throw new ArgumentException("El precio unitario debe ser mayor a cero.", nameof(unitPrice));
        }

        ClinicInvoiceId = clinicInvoiceId;
        Description = description.Trim();
        Quantity = quantity;
        UnitPrice = unitPrice;
        LineTotal = quantity * unitPrice;
    }
}