using ClinicaProNV.Domain.Enums;

namespace ClinicaProNV.Application.Appointments.Models;

public sealed record AppointmentResponse(
    Guid Id,
    Guid PatientId,
    DateTime Date,
    AppointmentStatus Status
);
