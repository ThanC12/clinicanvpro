using ClinicaProNV.Domain.Entities;

namespace ClinicaProNV.Application.UseCases.Appointments;

public class CreateAppointmentUseCase
{
    public Appointment Execute(Guid patientId, Guid doctorId, DateTime date, string reason)
    {
        return new Appointment(patientId, doctorId, date, reason);
    }
}