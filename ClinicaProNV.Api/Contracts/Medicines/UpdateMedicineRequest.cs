namespace ClinicaProNV.Api.Contracts.Medicines;

public class UpdateMedicineRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Stock { get; set; }
    public bool RequiresPrescription { get; set; }
}