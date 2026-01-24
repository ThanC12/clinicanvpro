using ClinicaProNV.Application.DTOs.Billing;
using ClinicaProNV.Application.Interfaces.Billing;
using ClinicaProNV.Domain.Entities;
using ClinicaProNV.Domain.Billing;


namespace ClinicaProNV.Application.UseCases.Billing;

public class CreateClinicInvoiceUseCase
{
    private readonly IClinicInvoiceRepository _repository;

    public CreateClinicInvoiceUseCase(IClinicInvoiceRepository repository)
    {
        _repository = repository;
    }

    public async Task ExecuteAsync(CreateClinicInvoiceDto dto)
    {
        var invoice = new ClinicInvoice(dto.PatientId);

        foreach (var item in dto.Items)
        {
            invoice.AddItem(item.Description, item.Price);
        }

        await _repository.AddAsync(invoice);
    }
}
