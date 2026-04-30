namespace ClinicaProNV.Api.Contracts.Patients;

public class UpdatePatientRequest
{
    public string FullName { get; set; } = string.Empty;

    public string Identification { get; set; } = string.Empty;
}