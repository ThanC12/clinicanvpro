namespace ClinicaProNV.Domain.Entities;

public class PatientRecord
{
    public Guid Id { get; private set; }
    public Guid PatientId { get; private set; }
    public string ReasonForVisit { get; private set; } = string.Empty;
    public string CurrentCondition { get; private set; } = string.Empty;
    public string Symptoms { get; private set; } = string.Empty;
    public string Allergies { get; private set; } = string.Empty;
    public string MedicalHistory { get; private set; } = string.Empty;
    public string VitalSigns { get; private set; } = string.Empty;
    public string PhysicalSheetReference { get; private set; } = string.Empty;
    public string PhysicalSheetTranscript { get; private set; } = string.Empty;
    public string Notes { get; private set; } = string.Empty;
    public DateTime CreatedAtUtc { get; private set; }

    protected PatientRecord()
    {
    }

    public PatientRecord(
        Guid patientId,
        string reasonForVisit,
        string currentCondition,
        string symptoms,
        string allergies,
        string medicalHistory,
        string vitalSigns,
        string physicalSheetReference,
        string physicalSheetTranscript,
        string notes)
    {
        if (patientId == Guid.Empty)
        {
            throw new ArgumentException("El paciente es obligatorio.", nameof(patientId));
        }

        if (string.IsNullOrWhiteSpace(reasonForVisit))
        {
            throw new ArgumentException("El motivo de ingreso es obligatorio.", nameof(reasonForVisit));
        }

        Id = Guid.NewGuid();
        PatientId = patientId;
        ReasonForVisit = reasonForVisit.Trim();
        CurrentCondition = currentCondition.Trim();
        Symptoms = symptoms.Trim();
        Allergies = allergies.Trim();
        MedicalHistory = medicalHistory.Trim();
        VitalSigns = vitalSigns.Trim();
        PhysicalSheetReference = physicalSheetReference.Trim();
        PhysicalSheetTranscript = physicalSheetTranscript.Trim();
        Notes = notes.Trim();
        CreatedAtUtc = DateTime.UtcNow;
    }
}
