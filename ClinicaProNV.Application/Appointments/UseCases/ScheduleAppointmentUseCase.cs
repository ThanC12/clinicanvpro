using ClinicaProNV.Application.Appointments.Models;
using ClinicaProNV.Application.Appointments.Ports;
using ClinicaProNV.Domain.Entities;

namespace ClinicaProNV.Application.Appointments.UseCases;

public sealed class ScheduleAppointmentUseCase
{
    private readonly IAppointmentRepository _appointmentRepository;

    public ScheduleAppointmentUseCase(IAppointmentRepository appointmentRepository)
    {
        _appointmentRepository = appointmentRepository;
    }

    public async Task<AppointmentResponse> ExecuteAsync(
        ScheduleAppointmentRequest request,
        CancellationToken ct = default)
    {
        var appointment = new Appointment(
            request.PatientId,
            request.DoctorId,
            request.Date,
            request.Reason
        );

        await _appointmentRepository.AddAsync(appointment, ct);

        return new AppointmentResponse(
            appointment.Id,
            appointment.PatientId,
            appointment.Date,
            appointment.Status
        );
    }
}