using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Pharmacy;

public class Medicine : BaseEntity
{
    public string Name { get; private set; } = string.Empty;

    public decimal UnitPrice { get; private set; }

    public int Stock { get; private set; }

    public bool RequiresPrescription { get; private set; }

    protected Medicine()
    {
    }

    public Medicine(string name, decimal unitPrice, int stock, bool requiresPrescription)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("El nombre del medicamento es obligatorio.", nameof(name));
        }

        if (unitPrice <= 0)
        {
            throw new ArgumentException("El precio unitario debe ser mayor a cero.", nameof(unitPrice));
        }

        if (stock < 0)
        {
            throw new ArgumentException("El stock no puede ser negativo.", nameof(stock));
        }

        Name = name.Trim();
        UnitPrice = unitPrice;
        Stock = stock;
        RequiresPrescription = requiresPrescription;
    }

    public void Update(string name, decimal unitPrice, int stock, bool requiresPrescription)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("El nombre del medicamento es obligatorio.", nameof(name));
        }

        if (unitPrice <= 0)
        {
            throw new ArgumentException("El precio unitario debe ser mayor a cero.", nameof(unitPrice));
        }

        if (stock < 0)
        {
            throw new ArgumentException("El stock no puede ser negativo.", nameof(stock));
        }

        Name = name.Trim();
        UnitPrice = unitPrice;
        Stock = stock;
        RequiresPrescription = requiresPrescription;
    }

    public void DecreaseStock(int quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentException("La cantidad debe ser mayor a cero.", nameof(quantity));
        }

        if (quantity > Stock)
        {
            throw new InvalidOperationException("No hay stock suficiente.");
        }

        Stock -= quantity;
    }
}