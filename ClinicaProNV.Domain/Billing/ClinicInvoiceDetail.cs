namespace ClinicaProNV.Domain.Billing;

public class ClinicInvoiceDetail
{
    public Guid Id { get; set; } = Guid.NewGuid();   // ✅ PK

    public Guid ClinicInvoiceId { get; set; }        // FK
    public ClinicInvoice ClinicInvoice { get; set; } = default!;

    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}
