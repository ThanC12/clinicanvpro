using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Entities;

public class Doctor : BaseEntity
{
    public string FullName { get; private set; }
    public string Specialty { get; private set; }

    protected Doctor() { }

    public Doctor(string fullName, string specialty)
    {
        FullName = fullName;
        Specialty = specialty;
    }
}
