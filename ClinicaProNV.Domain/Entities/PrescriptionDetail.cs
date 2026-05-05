namespace ClinicaProNV.Domain.Entities;

public class PrescriptionDetail
{
    public Guid Id { get; private set; }
    public Guid PrescriptionId { get; private set; }
    public Guid MedicineId { get; private set; }
    public int Quantity { get; private set; }
    public string Dosage { get; private set; } = string.Empty;
    public string Instructions { get; private set; } = string.Empty;
    public DateTime CreatedAtUtc { get; private set; }

    protected PrescriptionDetail()
    {
    }

    public PrescriptionDetail(
        Guid prescriptionId,
        Guid medicineId,
        int quantity,
        string dosage,
        string instructions)
    {
        if (prescriptionId == Guid.Empty)
        {
            throw new ArgumentException("La receta es obligatoria.", nameof(prescriptionId));
        }

        if (medicineId == Guid.Empty)
        {
            throw new ArgumentException("El medicamento es obligatorio.", nameof(medicineId));
        }

        if (quantity <= 0)
        {
            throw new ArgumentException("La cantidad debe ser mayor a cero.", nameof(quantity));
        }

        Id = Guid.NewGuid();
        PrescriptionId = prescriptionId;
        MedicineId = medicineId;
        Quantity = quantity;
        Dosage = string.IsNullOrWhiteSpace(dosage) ? "Según indicación médica" : dosage.Trim();
        Instructions = string.IsNullOrWhiteSpace(instructions) ? "Sin instrucciones adicionales" : instructions.Trim();
        CreatedAtUtc = DateTime.UtcNow;
    }
}
