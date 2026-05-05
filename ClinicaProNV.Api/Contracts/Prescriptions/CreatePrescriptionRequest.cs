namespace ClinicaProNV.Api.Contracts.Prescriptions;

public sealed class CreatePrescriptionRequest
{
    public Guid AppointmentId { get; set; }
    public string Notes { get; set; } = string.Empty;
    public List<CreatePrescriptionDetailRequest> Details { get; set; } = new();
}
