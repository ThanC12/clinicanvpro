using ClinicaProNV.Domain.Common;

namespace ClinicaProNV.Domain.Entities;

public class Stock : BaseEntity
{
    public Guid ProductId { get; private set; }
    public int Quantity { get; private set; }

    protected Stock() { }

    public Stock(Guid productId, int quantity)
    {
        ProductId = productId;
        Quantity = quantity;
    }

    public void Decrease(int qty)
    {
        if (qty <= 0) throw new InvalidOperationException("Cantidad inválida");
        if (Quantity < qty) throw new InvalidOperationException("Stock insuficiente");
        Quantity -= qty;
    }
}
