namespace ClinicaProNV.Api.Contracts.Patients;

public class CreatePatientRecordRequest
{
    public string ReasonForVisit { get; set; } = string.Empty;
    public string CurrentCondition { get; set; } = string.Empty;
    public string Symptoms { get; set; } = string.Empty;
    public string Allergies { get; set; } = string.Empty;
    public string MedicalHistory { get; set; } = string.Empty;
    public string VitalSigns { get; set; } = string.Empty;
    public string PhysicalSheetReference { get; set; } = string.Empty;
    public string PhysicalSheetTranscript { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
}
