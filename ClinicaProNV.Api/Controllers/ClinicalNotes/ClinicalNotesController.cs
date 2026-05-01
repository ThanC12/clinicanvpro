using ClinicaProNV.Api.Contracts.ClinicalNotes;
using ClinicaProNV.Domain.Entities;
using ClinicaProNV.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaProNV.Api.Controllers.ClinicalNotes;

[ApiController]
[Route("api/clinical-notes")]
[Authorize]
public class ClinicalNotesController : ControllerBase
{
    private readonly ClinicaProNVDbContext _db;

    public ClinicalNotesController(ClinicaProNVDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var notes = await _db.ClinicalNotes
            .OrderByDescending(n => n.CreatedAtUtc)
            .Select(n => new
            {
                n.Id,
                n.AppointmentId,
                n.Notes,
                n.CreatedAtUtc,

                AppointmentDate = _db.Appointments
                    .Where(a => a.Id == n.AppointmentId)
                    .Select(a => a.Date)
                    .FirstOrDefault(),

                PatientId = _db.Appointments
                    .Where(a => a.Id == n.AppointmentId)
                    .Select(a => a.PatientId)
                    .FirstOrDefault(),

                PatientName = _db.Appointments
                    .Where(a => a.Id == n.AppointmentId)
                    .Join(
                        _db.Patients,
                        a => a.PatientId,
                        p => p.Id,
                        (a, p) => p.FullName
                    )
                    .FirstOrDefault(),

                DoctorId = _db.Appointments
                    .Where(a => a.Id == n.AppointmentId)
                    .Select(a => a.DoctorId)
                    .FirstOrDefault(),

                DoctorName = _db.Appointments
                    .Where(a => a.Id == n.AppointmentId)
                    .Join(
                        _db.Doctors,
                        a => a.DoctorId,
                        d => d.Id,
                        (a, d) => d.FullName
                    )
                    .FirstOrDefault()
            })
            .ToListAsync(ct);

        return Ok(notes);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateClinicalNoteRequest request,
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

        if (string.IsNullOrWhiteSpace(request.Notes))
        {
            return BadRequest("La nota clínica es obligatoria.");
        }

        var appointmentExists = await _db.Appointments
            .AnyAsync(a => a.Id == request.AppointmentId, ct);

        if (!appointmentExists)
        {
            return NotFound("La cita seleccionada no existe.");
        }

        var note = new ClinicalNote(request.AppointmentId, request.Notes);

        _db.ClinicalNotes.Add(note);
        await _db.SaveChangesAsync(ct);

        return Created($"/api/clinical-notes/{note.Id}", new
        {
            note.Id,
            note.AppointmentId,
            note.Notes,
            note.CreatedAtUtc
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateClinicalNoteRequest request,
        CancellationToken ct)
    {
        if (request is null)
        {
            return BadRequest("El cuerpo de la solicitud es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.Notes))
        {
            return BadRequest("La nota clínica es obligatoria.");
        }

        var note = await _db.ClinicalNotes
            .FirstOrDefaultAsync(n => n.Id == id, ct);

        if (note is null)
        {
            return NotFound("Nota clínica no encontrada.");
        }

        note.Update(request.Notes);

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            note.Id,
            note.AppointmentId,
            note.Notes,
            note.CreatedAtUtc
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var note = await _db.ClinicalNotes
            .FirstOrDefaultAsync(n => n.Id == id, ct);

        if (note is null)
        {
            return NotFound("Nota clínica no encontrada.");
        }

        _db.ClinicalNotes.Remove(note);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }
}