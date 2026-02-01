using ClinicaProNV.Application.Appointments.Ports;
using ClinicaProNV.Domain.Enums;

namespace ClinicaProNV.Application.Appointments.UseCases;

public sealed class CancelAppointmentUseCase
{
    private readonly IAppointmentRepository _repo;
    public CancelAppointmentUseCase(IAppointmentRepository repo) => _repo = repo;

    public async Task ExecuteAsync(Guid appointmentId, string? notes, CancellationToken ct)
    {
        var appt = await _repo.GetByIdAsync(appointmentId, ct)
            ?? throw new KeyNotFoundException("Cita no existe.");

      

        await _repo.UpdateAsync(appt, ct);
    }
}
