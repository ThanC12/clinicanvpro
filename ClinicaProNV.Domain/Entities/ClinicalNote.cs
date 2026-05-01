using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Entities;

public class ClinicalNote : BaseEntity
{
    public Guid AppointmentId { get; private set; }

    public string Notes { get; private set; } = string.Empty;

    protected ClinicalNote()
    {
    }

    public ClinicalNote(Guid appointmentId, string notes)
    {
        if (appointmentId == Guid.Empty)
        {
            throw new ArgumentException("La cita es obligatoria.", nameof(appointmentId));
        }

        if (string.IsNullOrWhiteSpace(notes))
        {
            throw new ArgumentException("La nota clínica es obligatoria.", nameof(notes));
        }

        AppointmentId = appointmentId;
        Notes = notes.Trim();
    }

    public void Update(string notes)
    {
        if (string.IsNullOrWhiteSpace(notes))
        {
            throw new ArgumentException("La nota clínica es obligatoria.", nameof(notes));
        }

        Notes = notes.Trim();
    }
}