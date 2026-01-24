using ClinicaProNV.Domain.Common;
using ClinicaProNV.Domain.Enums;

namespace ClinicaProNV.Domain.Entities;

public class Appointment : BaseEntity
{
    public Guid PatientId { get; private set; }
    public DateTime Date { get; private set; }
    public AppointmentStatus Status { get; private set; }

    protected Appointment() { }

    public Appointment(Guid patientId, DateTime date)
    {
        PatientId = patientId;
        Date = date;
        Status = AppointmentStatus.Scheduled;
    }

    public void Complete() => Status = AppointmentStatus.Completed;
    public void Cancel() => Status = AppointmentStatus.Cancelled;
}
