namespace ClinicaProNV.Domain.Entities;

public class Patient
{
    public Guid Id { get; private set; }

    public string FullName { get; private set; } = string.Empty;

    public string Identification { get; private set; } = string.Empty;

    public DateTime CreatedAtUtc { get; private set; }

    // Constructor vacío para Entity Framework
    private Patient()
    {
    }

    // Constructor usado por CreatePatientUseCase
    public Patient(string fullName, string identification)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new ArgumentException("El nombre completo es obligatorio.", nameof(fullName));
        }

        if (string.IsNullOrWhiteSpace(identification))
        {
            throw new ArgumentException("La identificación es obligatoria.", nameof(identification));
        }

        Id = Guid.NewGuid();
        FullName = fullName.Trim();
        Identification = identification.Trim();
        CreatedAtUtc = DateTime.UtcNow;
    }
 public void Update(string fullName, string identification)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new ArgumentException("El nombre completo es obligatorio.", nameof(fullName));
        }

        if (string.IsNullOrWhiteSpace(identification))
        {
            throw new ArgumentException("La identificación es obligatoria.", nameof(identification));
        }

        FullName = fullName.Trim();
        Identification = identification.Trim();
    }
}