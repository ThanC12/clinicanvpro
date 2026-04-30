namespace ClinicaProNV.Application.Appointments.Models;

public sealed record ScheduleAppointmentRequest(
    Guid PatientId,
    DateTime Date
);
