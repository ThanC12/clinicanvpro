namespace ClinicaProNV.Application.DTOs.Pharmacy;

public class CreatePharmacyInvoiceDto
{
    public Guid PatientId { get; set; }
    public List<PharmacyInvoiceItemDto> Items { get; set; } = new();
}

public class PharmacyInvoiceItemDto
{
    public Guid MedicineId { get; set; }
    public int Quantity { get; set; }
}
