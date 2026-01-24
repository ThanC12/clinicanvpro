using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Entities;

public class Role : BaseEntity
{
    public string Name { get; private set; } = default!;

    // Navegación para la tabla puente UserRoles
    public ICollection<UserRole> UserRoles { get; private set; } = new List<UserRole>();

    protected Role() { } // EF

    public Role(string name)
    {
        Name = name;
    }
}
