namespace ClinicaProNV.Api.Contracts.Appointments;

public sealed record UpdateAppointmentRequest(
    Guid PatientId,
    Guid DoctorId,
    DateTime Date,
    string Reason);
