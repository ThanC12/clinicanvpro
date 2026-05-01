using ClinicaProNV.Application.Appointments.Ports;

namespace ClinicaProNV.Application.Appointments.UseCases;

public sealed class CancelAppointmentUseCase
{
    private readonly IAppointmentRepository _appointmentRepository;

    public CancelAppointmentUseCase(IAppointmentRepository appointmentRepository)
    {
        _appointmentRepository = appointmentRepository;
    }

    public async Task ExecuteAsync(Guid appointmentId, string? notes, CancellationToken ct = default)
    {
        await _appointmentRepository.CancelAsync(appointmentId, ct);
    }
}