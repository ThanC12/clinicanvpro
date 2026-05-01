namespace ClinicaProNV.Api.Contracts.ClinicalNotes;

public class CreateClinicalNoteRequest
{
    public Guid AppointmentId { get; set; }

    public string Notes { get; set; } = string.Empty;
}