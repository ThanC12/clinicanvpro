namespace ClinicaProNV.Domain.Entities;

public class Prescription
{
    public Guid Id { get; private set; }
    public Guid AppointmentId { get; private set; }
    public string Notes { get; private set; } = string.Empty;
    public DateTime CreatedAtUtc { get; private set; }

    protected Prescription()
    {
    }

    public Prescription(Guid appointmentId, string notes)
    {
        if (appointmentId == Guid.Empty)
        {
            throw new ArgumentException("La cita es obligatoria.", nameof(appointmentId));
        }

        Id = Guid.NewGuid();
        AppointmentId = appointmentId;
        Notes = string.IsNullOrWhiteSpace(notes) ? "Sin observaciones" : notes.Trim();
        CreatedAtUtc = DateTime.UtcNow;
    }
}
