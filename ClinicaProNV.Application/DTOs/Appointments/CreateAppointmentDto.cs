namespace ClinicaProNV.Application.DTOs.Appointments;

public class CreateAppointmentDto
{
    public Guid PatientId { get; set; }
    public DateTime Date { get; set; }
}
