using ClinicaProNV.Application.Appointments.Models;
using ClinicaProNV.Application.Appointments.Ports;
using ClinicaProNV.Domain.Entities;

namespace ClinicaProNV.Application.Appointments.UseCases;

public sealed class ScheduleAppointmentUseCase

{
    private readonly IAppointmentRepository _repo;

    public ScheduleAppointmentUseCase(IAppointmentRepository repo)
    {
        _repo = repo ?? throw new ArgumentNullException(nameof(repo));
    }

    public async Task<AppointmentResponse> ExecuteAsync(
        ScheduleAppointmentRequest req,
        CancellationToken ct)
    {
        if (req is null) throw new ArgumentNullException(nameof(req));
        if (req.PatientId == Guid.Empty) throw new ArgumentException("PatientId es requerido.", nameof(req.PatientId));

        // Si quieres bloquear fechas en el pasado (opcional):
        // if (req.Date < DateTime.UtcNow) throw new ArgumentException("La fecha de la cita no puede ser en el pasado.", nameof(req.Date));

        var appointment = new Appointment(req.PatientId, req.Date);

        await _repo.AddAsync(appointment, ct);

        return new AppointmentResponse(
            appointment.Id,
            appointment.PatientId,
            appointment.Date,
            appointment.Status
        );
    }
}
