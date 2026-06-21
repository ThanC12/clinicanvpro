using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; private set; } = default!;
    public string PasswordHash { get; private set; } = default!;
    public string PhoneNumber { get; private set; } = string.Empty;
    public bool HasTemporaryPassword { get; private set; }
    public DateTime? TemporaryPasswordExpiresAtUtc { get; private set; }
    public bool IsActive { get; private set; } = true;

    public ICollection<UserRole> UserRoles { get; private set; } = new List<UserRole>();

    protected User() { } // EF

    public User(string email, string passwordHash)
    {
        Email = email;
        PasswordHash = passwordHash;
        IsActive = true;
    }

    public User(string email, string passwordHash, string phoneNumber, DateTime? temporaryPasswordExpiresAtUtc)
        : this(email, passwordHash)
    {
        PhoneNumber = string.IsNullOrWhiteSpace(phoneNumber) ? string.Empty : phoneNumber.Trim();
        HasTemporaryPassword = temporaryPasswordExpiresAtUtc is not null;
        TemporaryPasswordExpiresAtUtc = temporaryPasswordExpiresAtUtc;
    }

    public void Activate() => IsActive = true;
    public void Deactivate() => IsActive = false;

    public void UpdatePhoneNumber(string phoneNumber)
    {
        PhoneNumber = string.IsNullOrWhiteSpace(phoneNumber) ? string.Empty : phoneNumber.Trim();
    }

    public void SetTemporaryPassword(string passwordHash, DateTime expiresAtUtc)
    {
        PasswordHash = passwordHash;
        HasTemporaryPassword = true;
        TemporaryPasswordExpiresAtUtc = expiresAtUtc;
    }

    public void ChangePassword(string passwordHash)
    {
        PasswordHash = passwordHash;
        HasTemporaryPassword = false;
        TemporaryPasswordExpiresAtUtc = null;
    }
}
