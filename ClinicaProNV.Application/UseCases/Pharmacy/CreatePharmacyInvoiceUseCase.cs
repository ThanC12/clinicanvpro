using ClinicaProNV.Application.Interfaces.Pharmacy;
using ClinicaProNV.Domain.Pharmacy;
using ClinicaProNV.Application.DTOs.Pharmacy;// <-- AJUSTA si está en DTOs.Pharmacy

namespace ClinicaProNV.Application.UseCases.Pharmacy;

public class CreatePharmacyInvoiceUseCase
{
    private readonly IPharmacyInvoiceRepository _invoiceRepository;
    private readonly IMedicineRepository _medicineRepository;

    public CreatePharmacyInvoiceUseCase(
        IPharmacyInvoiceRepository invoiceRepository,
        IMedicineRepository medicineRepository)
    {
        _invoiceRepository = invoiceRepository;
        _medicineRepository = medicineRepository;
    }

    public async Task ExecuteAsync(CreatePharmacyInvoiceDto dto) // <-- AJUSTA nombre si tu DTO se llama distinto
    {
        var invoice = new PharmacyInvoice(dto.PatientId);

        foreach (var item in dto.Items)
        {
            var medicine = await _medicineRepository.GetByIdAsync(item.MedicineId)
                ?? throw new Exception($"Medicine not found: {item.MedicineId}");

            invoice.AddItem(item.MedicineId, item.Quantity, medicine.UnitPrice);
        }

        await _invoiceRepository.AddAsync(invoice);
    }
}
