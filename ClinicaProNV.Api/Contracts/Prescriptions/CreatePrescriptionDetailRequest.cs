namespace ClinicaProNV.Api.Contracts.Prescriptions;

public sealed class CreatePrescriptionDetailRequest
{
    public Guid MedicineId { get; set; }
    public int Quantity { get; set; }
    public string Dosage { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
}
