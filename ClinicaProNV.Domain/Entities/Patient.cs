using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Entities;

public class Patient : BaseEntity
{
    public string FullName { get; private set; }
    public string Identification { get; private set; }

    protected Patient() { }

    public Patient(string fullName, string identification)
    {
        FullName = fullName;
        Identification = identification;
    }
}
