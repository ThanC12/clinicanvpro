using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Entities;

public class Product : BaseEntity
{
    public string Name { get; private set; }
    public decimal Price { get; private set; }
    public Guid CategoryId { get; private set; }

    protected Product() { }

    public Product(string name, decimal price, Guid categoryId)
    {
        Name = name;
        Price = price;
        CategoryId = categoryId;
    }
}
