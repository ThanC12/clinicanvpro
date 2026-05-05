using ClinicaProNV.Api.Contracts.Prescriptions;
using ClinicaProNV.Domain.Entities;
using ClinicaProNV.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaProNV.Api.Controllers.Prescriptions;

[ApiController]
[Route("api/prescriptions")]
[Authorize]
public class PrescriptionsController : ControllerBase
{
    private readonly ClinicaProNVDbContext _db;

    public PrescriptionsController(ClinicaProNVDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var prescriptions = await _db.Prescriptions
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(p => new
            {
                p.Id,
                p.AppointmentId,
                p.Notes,
                p.CreatedAtUtc,
                AppointmentDate = _db.Appointments
                    .Where(a => a.Id == p.AppointmentId)
                    .Select(a => a.Date)
                    .FirstOrDefault(),
                PatientName = _db.Appointments
                    .Where(a => a.Id == p.AppointmentId)
                    .Join(_db.Patients, a => a.PatientId, patient => patient.Id, (a, patient) => patient.FullName)
                    .FirstOrDefault(),
                DoctorName = _db.Appointments
                    .Where(a => a.Id == p.AppointmentId)
                    .Join(_db.Doctors, a => a.DoctorId, doctor => doctor.Id, (a, doctor) => doctor.FullName)
                    .FirstOrDefault(),
                Details = _db.PrescriptionDetails
                    .Where(d => d.PrescriptionId == p.Id)
                    .Select(d => new
                    {
                        d.Id,
                        d.MedicineId,
                        MedicineName = _db.Medicines
                            .Where(m => m.Id == d.MedicineId)
                            .Select(m => m.Name)
                            .FirstOrDefault(),
                        d.Quantity,
                        d.Dosage,
                        d.Instructions
                    })
                    .ToList()
            })
            .ToListAsync(ct);

        return Ok(prescriptions);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreatePrescriptionRequest request,
        CancellationToken ct)
    {
        if (request is null)
        {
            return BadRequest("El cuerpo de la solicitud es obligatorio.");
        }

        if (request.AppointmentId == Guid.Empty)
        {
            return BadRequest("Debe seleccionar una cita.");
        }

        if (request.Details is null || request.Details.Count == 0)
        {
            return BadRequest("Debe agregar al menos un medicamento.");
        }

        var appointmentExists = await _db.Appointments
            .AnyAsync(a => a.Id == request.AppointmentId, ct);

        if (!appointmentExists)
        {
            return NotFound("La cita seleccionada no existe.");
        }

        var medicineIds = request.Details.Select(d => d.MedicineId).Distinct().ToList();
        var medicinesCount = await _db.Medicines
            .CountAsync(m => medicineIds.Contains(m.Id), ct);

        if (medicinesCount != medicineIds.Count)
        {
            return NotFound("Uno de los medicamentos seleccionados no existe.");
        }

        foreach (var detail in request.Details)
        {
            if (detail.Quantity <= 0)
            {
                return BadRequest("La cantidad debe ser mayor a cero.");
            }
        }

        var prescription = new Prescription(request.AppointmentId, request.Notes);
        _db.Prescriptions.Add(prescription);
        await _db.SaveChangesAsync(ct);

        var details = request.Details
            .Select(d => new PrescriptionDetail(
                prescription.Id,
                d.MedicineId,
                d.Quantity,
                d.Dosage,
                d.Instructions))
            .ToList();

        _db.PrescriptionDetails.AddRange(details);
        await _db.SaveChangesAsync(ct);

        return Created($"/api/prescriptions/{prescription.Id}", new
        {
            prescription.Id,
            prescription.AppointmentId,
            prescription.Notes,
            prescription.CreatedAtUtc,
            Details = details
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var prescription = await _db.Prescriptions.FirstOrDefaultAsync(p => p.Id == id, ct);

        if (prescription is null)
        {
            return NotFound("Receta no encontrada.");
        }

        var details = await _db.PrescriptionDetails
            .Where(d => d.PrescriptionId == id)
            .ToListAsync(ct);

        _db.PrescriptionDetails.RemoveRange(details);
        _db.Prescriptions.Remove(prescription);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }
}
