using Microsoft.AspNetCore.Mvc;
using ClinicaProNV.Domain.Pharmacy;
using ClinicaProNV.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ClinicaProNV.Api.Services.WhatsApp;

namespace ClinicaProNV.Api.Controllers.Pharmacy;

[ApiController]
[Route("api/pharmacy/invoices")]
[Authorize]
public class PharmacyInvoiceController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromServices] ClinicaProNVDbContext db,
        CancellationToken ct)
    {
        var invoices = await db.PharmacyInvoices
            .OrderByDescending(i => i.CreatedAtUtc)
            .Select(i => new
            {
                i.Id,
                i.PatientId,
                PatientName = db.Patients
                    .Where(p => p.Id == i.PatientId)
                    .Select(p => p.FullName)
                    .FirstOrDefault(),
                i.Total,
                i.CreatedAtUtc,
                DetailsCount = db.PharmacyInvoiceDetails
                    .Count(d => d.PharmacyInvoiceId == i.Id)
            })
            .ToListAsync(ct);

        return Ok(invoices);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreatePharmacyInvoiceRequest request,
        [FromServices] ClinicaProNVDbContext db,
        [FromServices] WhatsAppNotificationService whatsApp,
        CancellationToken ct)
    {
        if (request is null)
        {
            return BadRequest("El cuerpo de la solicitud es obligatorio.");
        }

        if (request.PatientId == Guid.Empty)
        {
            return BadRequest("Debe seleccionar un paciente.");
        }

        if (request.Items is null || request.Items.Count == 0)
        {
            return BadRequest("Debe ingresar al menos un medicamento.");
        }

        var patientExists = await db.Patients.AnyAsync(p => p.Id == request.PatientId, ct);
        if (!patientExists)
        {
            return NotFound("El paciente seleccionado no existe.");
        }

        var medicineIds = request.Items.Select(i => i.MedicineId).Distinct().ToList();
        var medicines = await db.Medicines
            .Where(m => medicineIds.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id, ct);

        var invoice = new PharmacyInvoice(request.PatientId);

        foreach (var item in request.Items)
        {
            if (item.MedicineId == Guid.Empty)
            {
                return BadRequest("Debe seleccionar un medicamento.");
            }

            if (item.Quantity <= 0)
            {
                return BadRequest("La cantidad debe ser mayor a cero.");
            }

            if (!medicines.TryGetValue(item.MedicineId, out var medicine))
            {
                return NotFound("Uno de los medicamentos seleccionados no existe.");
            }

            medicine.DecreaseStock(item.Quantity);
            invoice.AddItem(medicine.Id, item.Quantity, medicine.UnitPrice);
        }

        db.PharmacyInvoices.Add(invoice);
        await db.SaveChangesAsync(ct);
        await whatsApp.NotifyPharmacyInvoiceCreatedAsync(invoice.Id, ct);

        return Created($"/api/pharmacy/invoices/{invoice.Id}", new
        {
            invoice.Id,
            invoice.PatientId,
            invoice.Total,
            invoice.CreatedAtUtc,
            Details = invoice.Details.Select(d => new
            {
                d.Id,
                d.MedicineId,
                d.Quantity,
                d.UnitPrice,
                d.LineTotal
            })
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(
        Guid id,
        [FromServices] ClinicaProNVDbContext db,
        CancellationToken ct)
    {
        var invoice = await db.PharmacyInvoices
            .Where(i => i.Id == id)
            .Select(i => new
            {
                i.Id,
                i.PatientId,
                PatientName = db.Patients
                    .Where(p => p.Id == i.PatientId)
                    .Select(p => p.FullName)
                    .FirstOrDefault(),
                i.Total,
                i.CreatedAtUtc,
                Details = db.PharmacyInvoiceDetails
                    .Where(d => d.PharmacyInvoiceId == i.Id)
                    .Select(d => new
                    {
                        d.Id,
                        d.MedicineId,
                        MedicineName = db.Medicines
                            .Where(m => m.Id == d.MedicineId)
                            .Select(m => m.Name)
                            .FirstOrDefault(),
                        d.Quantity,
                        d.UnitPrice,
                        d.LineTotal
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync(ct);

        if (invoice is null)
        {
            return NotFound("Factura de farmacia no encontrada.");
        }

        return Ok(invoice);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id,
        [FromServices] ClinicaProNVDbContext db,
        CancellationToken ct)
    {
        var invoice = await db.PharmacyInvoices.FirstOrDefaultAsync(i => i.Id == id, ct);

        if (invoice is null)
        {
            return NotFound("Factura de farmacia no encontrada.");
        }

        var details = await db.PharmacyInvoiceDetails
            .Where(d => d.PharmacyInvoiceId == id)
            .ToListAsync(ct);

        db.PharmacyInvoiceDetails.RemoveRange(details);
        db.PharmacyInvoices.Remove(invoice);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    public sealed record CreatePharmacyInvoiceRequest(
        Guid PatientId,
        List<CreatePharmacyInvoiceItemRequest> Items);

    public sealed record CreatePharmacyInvoiceItemRequest(
        Guid MedicineId,
        int Quantity);
}
