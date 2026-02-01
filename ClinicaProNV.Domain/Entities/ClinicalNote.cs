using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Entities;

public class ClinicalNote : BaseEntity
{
    public Guid AppointmentId { get; private set; }
    public string Notes { get; private set; }

    protected ClinicalNote() { }

    public ClinicalNote(Guid appointmentId, string notes)
    {
        AppointmentId = appointmentId;
        Notes = notes;
    }
}
