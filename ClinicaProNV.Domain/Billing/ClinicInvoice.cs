using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Billing;

public class ClinicInvoice : BaseEntity
{
    public Guid PatientId { get; private set; }
    public decimal Total { get; private set; }

    private readonly List<ClinicInvoiceDetail> _details = new();
    public IReadOnlyCollection<ClinicInvoiceDetail> Details => _details;

    protected ClinicInvoice() { }

    public ClinicInvoice(Guid patientId)
    {
        PatientId = patientId;
        Total = 0;
    }

    public void AddItem(string description, decimal price, int quantity = 1)
    {
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Description is required", nameof(description));

        if (price <= 0)
            throw new ArgumentException("Price must be > 0", nameof(price));

        if (quantity <= 0)
            throw new ArgumentException("Quantity must be > 0", nameof(quantity));

        var detail = new ClinicInvoiceDetail
        {
            Description = description,
            UnitPrice = price,
            Quantity = quantity,
            LineTotal = price * quantity
        };

        _details.Add(detail);
        Total += detail.LineTotal;
    }
}
