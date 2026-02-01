using ClinicaProNV.Domain.Entities;

namespace ClinicaProNV.Application.Interfaces.Appointments;

public interface IAppointmentRepository
{
    Task AddAsync(Appointment appointment);
}
