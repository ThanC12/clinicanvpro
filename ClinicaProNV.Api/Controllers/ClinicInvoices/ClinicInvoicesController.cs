using ClinicaProNV.Api.Contracts.ClinicInvoices;
using ClinicaProNV.Domain.Billing;
using ClinicaProNV.Domain.Entities;
using ClinicaProNV.Infrastructure.Persistence.Context;
using ClinicaProNV.Api.Services.WhatsApp;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ClinicaProNV.Api.Controllers.ClinicInvoices;

[ApiController]
[Route("api/clinic-invoices")]
[Authorize]
public class ClinicInvoicesController : ControllerBase
{
    private readonly ClinicaProNVDbContext _db;

    public ClinicInvoicesController(ClinicaProNVDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var invoices = await _db.ClinicInvoices
            .Where(i => !i.IsDeleted)
            .OrderByDescending(i => i.CreatedAtUtc)
            .Select(i => new
            {
                i.Id,
                i.PatientId,
                PatientName = _db.Patients
                    .Where(p => p.Id == i.PatientId)
                    .Select(p => p.FullName)
                    .FirstOrDefault(),
                PatientEmail = _db.Patients
                    .Where(p => p.Id == i.PatientId)
                    .Select(p => p.Email)
                    .FirstOrDefault(),
                PatientWhatsApp = _db.Patients
                    .Where(p => p.Id == i.PatientId)
                    .Select(p => p.WhatsAppNumber)
                    .FirstOrDefault(),
                i.Total,
                i.CreatedAtUtc,
                DetailsCount = _db.ClinicInvoiceDetails
                    .Count(d => d.ClinicInvoiceId == i.Id)
            })
            .ToListAsync(ct);

        return Ok(invoices);
    }

    [HttpGet("deleted")]
    public async Task<IActionResult> GetDeleted(CancellationToken ct)
    {
        var deletedInvoices = await _db.InvoiceDeletionLogs
            .Where(x => x.InvoiceType == "Clinic")
            .OrderByDescending(x => x.DeletedAtUtc)
            .Select(x => new
            {
                x.InvoiceId,
                x.PatientId,
                x.PatientName,
                x.Total,
                x.DeletedByUserId,
                x.DeletedByEmail,
                x.Reason,
                x.DeletedAtUtc
            })
            .ToListAsync(ct);

        return Ok(deletedInvoices);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var invoice = await _db.ClinicInvoices
            .Where(i => i.Id == id && !i.IsDeleted)
            .Select(i => new
            {
                i.Id,
                i.PatientId,
                PatientName = _db.Patients
                    .Where(p => p.Id == i.PatientId)
                    .Select(p => p.FullName)
                    .FirstOrDefault(),
                PatientEmail = _db.Patients
                    .Where(p => p.Id == i.PatientId)
                    .Select(p => p.Email)
                    .FirstOrDefault(),
                PatientWhatsApp = _db.Patients
                    .Where(p => p.Id == i.PatientId)
                    .Select(p => p.WhatsAppNumber)
                    .FirstOrDefault(),
                i.Total,
                i.CreatedAtUtc,
                Details = _db.ClinicInvoiceDetails
                    .Where(d => d.ClinicInvoiceId == i.Id)
                    .Select(d => new
                    {
                        d.Id,
                        d.Description,
                        d.Quantity,
                        d.UnitPrice,
                        d.LineTotal,
                        d.CreatedAtUtc
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync(ct);

        if (invoice is null)
        {
            return NotFound("Factura clínica no encontrada.");
        }

        return Ok(invoice);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateClinicInvoiceRequest request,
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

        if (request.Details is null || request.Details.Count == 0)
        {
            return BadRequest("Debe ingresar al menos un detalle.");
        }

        var patientExists = await _db.Patients
            .AnyAsync(p => p.Id == request.PatientId, ct);

        if (!patientExists)
        {
            return NotFound("El paciente seleccionado no existe.");
        }

        foreach (var detail in request.Details)
        {
            if (string.IsNullOrWhiteSpace(detail.Description))
            {
                return BadRequest("La descripción del detalle es obligatoria.");
            }

            if (detail.Quantity <= 0)
            {
                return BadRequest("La cantidad debe ser mayor a cero.");
            }

            if (detail.UnitPrice <= 0)
            {
                return BadRequest("El precio unitario debe ser mayor a cero.");
            }
        }

        var total = request.Details.Sum(d => d.Quantity * d.UnitPrice);

        var invoice = new ClinicInvoice(request.PatientId, total);

        _db.ClinicInvoices.Add(invoice);
        await _db.SaveChangesAsync(ct);

        var details = request.Details
            .Select(d => new ClinicInvoiceDetail(
                invoice.Id,
                d.Description,
                d.Quantity,
                d.UnitPrice
            ))
            .ToList();

        _db.ClinicInvoiceDetails.AddRange(details);
        await _db.SaveChangesAsync(ct);
        await whatsApp.NotifyClinicInvoiceCreatedAsync(invoice.Id, ct);

        return Created($"/api/clinic-invoices/{invoice.Id}", new
        {
            invoice.Id,
            invoice.PatientId,
            invoice.Total,
            invoice.CreatedAtUtc,
            Details = details.Select(d => new
            {
                d.Id,
                d.Description,
                d.Quantity,
                d.UnitPrice,
                d.LineTotal
            })
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id,
        [FromBody] DeleteClinicInvoiceRequest request,
        CancellationToken ct)
    {
        var invoice = await _db.ClinicInvoices
            .FirstOrDefaultAsync(i => i.Id == id, ct);

        if (invoice is null)
        {
            return NotFound("Factura clínica no encontrada.");
        }

        if (invoice.IsDeleted)
        {
            return Conflict("La factura ya fue anulada.");
        }

        var deletedByUserId = GetCurrentUserId();
        var deletedByEmail = GetCurrentUserEmail();
        var reason = string.IsNullOrWhiteSpace(request?.Reason)
            ? "Anulación sin motivo registrado"
            : request.Reason.Trim();

        var patient = await _db.Patients
            .Where(p => p.Id == invoice.PatientId)
            .Select(p => new { p.FullName })
            .FirstOrDefaultAsync(ct);

        invoice.MarkDeleted(deletedByUserId, deletedByEmail, reason);

        _db.InvoiceDeletionLogs.Add(new InvoiceDeletionLog(
            "Clinic",
            invoice.Id,
            invoice.PatientId,
            patient?.FullName ?? "Sin nombre",
            invoice.Total,
            deletedByUserId,
            deletedByEmail,
            reason));

        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        return Guid.TryParse(raw, out var userId) ? userId : Guid.Empty;
    }

    private string GetCurrentUserEmail()
    {
        return User.FindFirstValue(ClaimTypes.Email)
            ?? User.FindFirstValue("email")
            ?? User.Identity?.Name
            ?? "Desconocido";
    }

    public sealed record DeleteClinicInvoiceRequest(string? Reason);
}
