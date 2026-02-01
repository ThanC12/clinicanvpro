using ClinicaProNV.Domain.Entities;

namespace ClinicaProNV.Application.Appointments.Ports;

public interface IAppointmentRepository
{
    Task<Appointment?> GetByIdAsync(Guid id, CancellationToken ct);
    Task<IReadOnlyList<Appointment>> GetByPatientAsync(Guid patientId, CancellationToken ct);

    Task AddAsync(Appointment appointment, CancellationToken ct);
    Task UpdateAsync(Appointment appointment, CancellationToken ct);
}
