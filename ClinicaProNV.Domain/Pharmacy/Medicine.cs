using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Pharmacy;

public class Medicine : BaseEntity
{
    public string Name { get; private set; }
    public decimal UnitPrice { get; private set; }
    public int Stock { get; private set; }
    public bool RequiresPrescription { get; private set; }

    protected Medicine() { }

    public Medicine(string name, decimal unitPrice, int stock, bool requiresPrescription)
    {
        Name = name;
        UnitPrice = unitPrice;
        Stock = stock;
        RequiresPrescription = requiresPrescription;
    }

    public void DecreaseStock(int quantity)
    {
        if (quantity <= 0) throw new InvalidOperationException("Cantidad inválida");
        if (Stock < quantity) throw new InvalidOperationException("Stock insuficiente");
        Stock -= quantity;
    }
}
