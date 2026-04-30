namespace ClinicaProNV.Domain.Entities;

public class Doctor
{
    public Guid Id { get; private set; }

    public string FullName { get; private set; } = string.Empty;

    public string Specialty { get; private set; } = string.Empty;

    public DateTime CreatedAtUtc { get; private set; }

    private Doctor()
    {
    }

    public Doctor(string fullName, string specialty)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new ArgumentException("El nombre completo es obligatorio.", nameof(fullName));
        }

        if (string.IsNullOrWhiteSpace(specialty))
        {
            throw new ArgumentException("La especialidad es obligatoria.", nameof(specialty));
        }

        Id = Guid.NewGuid();
        FullName = fullName.Trim();
        Specialty = specialty.Trim();
        CreatedAtUtc = DateTime.UtcNow;
    }

    public void Update(string fullName, string specialty)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new ArgumentException("El nombre completo es obligatorio.", nameof(fullName));
        }

        if (string.IsNullOrWhiteSpace(specialty))
        {
            throw new ArgumentException("La especialidad es obligatoria.", nameof(specialty));
        }

        FullName = fullName.Trim();
        Specialty = specialty.Trim();
    }
}