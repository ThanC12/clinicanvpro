namespace ClinicaProNV.Api.Contracts.Patients;

public class CreatePatientRequest
{
    public string FullName { get; set; } = string.Empty;

    public string Identification { get; set; } = string.Empty;
}