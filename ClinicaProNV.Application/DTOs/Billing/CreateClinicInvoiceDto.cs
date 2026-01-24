namespace ClinicaProNV.Application.DTOs.Billing;

public class CreateClinicInvoiceDto
{
    public Guid PatientId { get; set; }
    public List<ClinicInvoiceItemDto> Items { get; set; } = new();
}
