namespace ClinicaProNV.Application.DTOs.Billing;

public class ClinicInvoiceItemDto
{
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
}
