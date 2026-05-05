namespace ClinicaProNV.Domain.Entities;

public class Patient
{
    public Guid Id { get; private set; }

    public string FullName { get; private set; } = string.Empty;

    public string Identification { get; private set; } = string.Empty;

    public string Email { get; private set; } = string.Empty;

    public string WhatsAppNumber { get; private set; } = string.Empty;

    public string BirthDate { get; private set; } = string.Empty;

    public string Gender { get; private set; } = string.Empty;

    public string Address { get; private set; } = string.Empty;

    public string EmergencyContactName { get; private set; } = string.Empty;

    public string EmergencyContactPhone { get; private set; } = string.Empty;

    public string BloodType { get; private set; } = string.Empty;

    public DateTime CreatedAtUtc { get; private set; }

    // Constructor vacío para Entity Framework
    private Patient()
    {
    }

    // Constructor usado por CreatePatientUseCase
    public Patient(
        string fullName,
        string identification,
        string email = "",
        string whatsAppNumber = "",
        string birthDate = "",
        string gender = "",
        string address = "",
        string emergencyContactName = "",
        string emergencyContactPhone = "",
        string bloodType = "")
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
        Email = email.Trim();
        WhatsAppNumber = whatsAppNumber.Trim();
        BirthDate = birthDate.Trim();
        Gender = gender.Trim();
        Address = address.Trim();
        EmergencyContactName = emergencyContactName.Trim();
        EmergencyContactPhone = emergencyContactPhone.Trim();
        BloodType = bloodType.Trim();
        CreatedAtUtc = DateTime.UtcNow;
    }
 public void Update(
        string fullName,
        string identification,
        string email = "",
        string whatsAppNumber = "",
        string birthDate = "",
        string gender = "",
        string address = "",
        string emergencyContactName = "",
        string emergencyContactPhone = "",
        string bloodType = "")
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
        Email = email.Trim();
        WhatsAppNumber = whatsAppNumber.Trim();
        BirthDate = birthDate.Trim();
        Gender = gender.Trim();
        Address = address.Trim();
        EmergencyContactName = emergencyContactName.Trim();
        EmergencyContactPhone = emergencyContactPhone.Trim();
        BloodType = bloodType.Trim();
    }
}
