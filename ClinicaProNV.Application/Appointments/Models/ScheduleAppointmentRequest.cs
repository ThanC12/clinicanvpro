namespace ClinicaProNV.Application.Appointments.Models;

public sealed record ScheduleAppointmentRequest(
    Guid PatientId,
    Guid DoctorId,
    DateTime Date,
    string Reason
);