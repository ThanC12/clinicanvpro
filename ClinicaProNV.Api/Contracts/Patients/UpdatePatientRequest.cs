namespace ClinicaProNV.Api.Contracts.Patients;

public class UpdatePatientRequest
{
    public string FullName { get; set; } = string.Empty;

    public string Identification { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string WhatsAppNumber { get; set; } = string.Empty;

    public string BirthDate { get; set; } = string.Empty;

    public string Gender { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string EmergencyContactName { get; set; } = string.Empty;

    public string EmergencyContactPhone { get; set; } = string.Empty;

    public string BloodType { get; set; } = string.Empty;
}
