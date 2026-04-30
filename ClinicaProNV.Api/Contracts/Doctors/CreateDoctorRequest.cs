namespace ClinicaProNV.Api.Contracts.Doctors;

public class CreateDoctorRequest
{
    public string FullName { get; set; } = string.Empty;

    public string Specialty { get; set; } = string.Empty;
}