using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Entities;

public class User : BaseEntity
{
    public string Email { get; private set; } = default!;
    public string PasswordHash { get; private set; } = default!;
    public bool IsActive { get; private set; } = true;

    public ICollection<UserRole> UserRoles { get; private set; } = new List<UserRole>();

    protected User() { } // EF

    public User(string email, string passwordHash)
    {
        Email = email;
        PasswordHash = passwordHash;
        IsActive = true;
    }

    public void Deactivate() => IsActive = false;
}
