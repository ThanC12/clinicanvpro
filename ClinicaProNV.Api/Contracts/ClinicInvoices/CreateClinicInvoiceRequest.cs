namespace ClinicaProNV.Api.Contracts.ClinicInvoices;

public class CreateClinicInvoiceRequest
{
    public Guid PatientId { get; set; }

    public List<CreateClinicInvoiceDetailRequest> Details { get; set; } = new();
}