using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Entities;

public class Category : BaseEntity
{
    public string Name { get; private set; }

    protected Category() { }

    public Category(string name)
    {
        Name = name;
    }
}
