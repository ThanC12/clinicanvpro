using ClinicaProNV.Domain.Common;
using ClinicaProNV.Domain.Enums;

namespace ClinicaProNV.Domain.Entities;

public class Appointment : BaseEntity
{
    public Guid PatientId { get; private set; }

    public Guid DoctorId { get; private set; }

    public DateTime Date { get; private set; }

    public string Reason { get; private set; } = string.Empty;

    public AppointmentStatus Status { get; private set; }

    protected Appointment()
    {
    }

    public Appointment(Guid patientId, Guid doctorId, DateTime date, string reason)
    {
        if (patientId == Guid.Empty)
            throw new ArgumentException("El paciente es obligatorio.", nameof(patientId));

        if (doctorId == Guid.Empty)
            throw new ArgumentException("El doctor es obligatorio.", nameof(doctorId));

        if (date == default)
            throw new ArgumentException("La fecha de la cita es obligatoria.", nameof(date));

        PatientId = patientId;
        DoctorId = doctorId;
        Date = date;
        Reason = string.IsNullOrWhiteSpace(reason) ? "Sin motivo" : reason.Trim();
        Status = AppointmentStatus.Scheduled;
    }

    public void Complete()
    {
        Status = AppointmentStatus.Completed;
    }

    public void Cancel()
    {
        Status = AppointmentStatus.Cancelled;
    }
}