using ClinicaProNV.Api.Contracts.Patients;
using ClinicaProNV.Domain.Entities;
using ClinicaProNV.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace ClinicaProNV.Api.Controllers.Patients;

[ApiController]
[Route("api/patients")]
[Authorize]
public class PatientsController : ControllerBase
{
    private readonly ClinicaProNVDbContext _db;

    public PatientsController(ClinicaProNVDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var patients = await _db.Patients
            .OrderByDescending(p => p.CreatedAtUtc)
            .Select(p => new
            {
                p.Id,
                p.FullName,
                p.Identification,
                p.Email,
                p.WhatsAppNumber,
                p.BirthDate,
                p.Gender,
                p.Address,
                p.EmergencyContactName,
                p.EmergencyContactPhone,
                p.BloodType,
                RecordsCount = _db.PatientRecords.Count(r => r.PatientId == p.Id),
                p.CreatedAtUtc
            })
            .ToListAsync();

        return Ok(patients);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePatientRequest request)
    {
        if (request is null)
        {
            return BadRequest("El cuerpo de la solicitud es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest("El nombre completo es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.Identification))
        {
            return BadRequest("La identificación es obligatoria.");
        }

        var fullName = request.FullName.Trim();
        var identification = request.Identification.Trim();

        var exists = await _db.Patients
            .AnyAsync(p => p.Identification == identification);

        if (exists)
        {
            return Conflict("Ya existe un paciente con esa identificación.");
        }

        var patient = new Patient(
            fullName,
            identification,
            request.Email,
            request.WhatsAppNumber,
            request.BirthDate,
            request.Gender,
            request.Address,
            request.EmergencyContactName,
            request.EmergencyContactPhone,
            request.BloodType);

        _db.Patients.Add(patient);
        await _db.SaveChangesAsync();

        return Created($"/api/patients/{patient.Id}", new
        {
            patient.Id,
            patient.FullName,
            patient.Identification,
            patient.Email,
            patient.WhatsAppNumber,
            patient.BirthDate,
            patient.Gender,
            patient.Address,
            patient.EmergencyContactName,
            patient.EmergencyContactPhone,
            patient.BloodType,
            patient.CreatedAtUtc
        });
    }
    [HttpPut("{id:guid}")]
public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePatientRequest request)
{
    if (request is null)
    {
        return BadRequest("El cuerpo de la solicitud es obligatorio.");
    }

    if (string.IsNullOrWhiteSpace(request.FullName))
    {
        return BadRequest("El nombre completo es obligatorio.");
    }

    if (string.IsNullOrWhiteSpace(request.Identification))
    {
        return BadRequest("La identificación es obligatoria.");
    }

    var patient = await _db.Patients
        .FirstOrDefaultAsync(p => p.Id == id);

    if (patient is null)
    {
        return NotFound("Paciente no encontrado.");
    }

    var identification = request.Identification.Trim();

    var exists = await _db.Patients
        .AnyAsync(p => p.Id != id && p.Identification == identification);

    if (exists)
    {
        return Conflict("Ya existe otro paciente con esa identificación.");
    }

    patient.Update(
        request.FullName,
        identification,
        request.Email,
        request.WhatsAppNumber,
        request.BirthDate,
        request.Gender,
        request.Address,
        request.EmergencyContactName,
        request.EmergencyContactPhone,
        request.BloodType);

    await _db.SaveChangesAsync();

    return Ok(new
    {
        patient.Id,
        patient.FullName,
        patient.Identification,
        patient.Email,
        patient.WhatsAppNumber,
        patient.BirthDate,
        patient.Gender,
        patient.Address,
        patient.EmergencyContactName,
        patient.EmergencyContactPhone,
        patient.BloodType,
        patient.CreatedAtUtc
    });
}

    [HttpGet("{id:guid}/records")]
    public async Task<IActionResult> GetRecords(Guid id, CancellationToken ct)
    {
        var patientExists = await _db.Patients.AnyAsync(p => p.Id == id, ct);

        if (!patientExists)
        {
            return NotFound("Paciente no encontrado.");
        }

        var records = await _db.PatientRecords
            .Where(r => r.PatientId == id)
            .OrderByDescending(r => r.CreatedAtUtc)
            .Select(r => new
            {
                r.Id,
                r.PatientId,
                r.ReasonForVisit,
                r.CurrentCondition,
                r.Symptoms,
                r.Allergies,
                r.MedicalHistory,
                r.VitalSigns,
                r.PhysicalSheetReference,
                r.PhysicalSheetTranscript,
                r.Notes,
                r.CreatedAtUtc
            })
            .ToListAsync(ct);

        return Ok(records);
    }

    [HttpPost("{id:guid}/records")]
    public async Task<IActionResult> CreateRecord(
        Guid id,
        [FromBody] CreatePatientRecordRequest request,
        CancellationToken ct)
    {
        if (request is null)
        {
            return BadRequest("El cuerpo de la solicitud es obligatorio.");
        }

        var patientExists = await _db.Patients.AnyAsync(p => p.Id == id, ct);

        if (!patientExists)
        {
            return NotFound("Paciente no encontrado.");
        }

        if (string.IsNullOrWhiteSpace(request.ReasonForVisit))
        {
            return BadRequest("El motivo de ingreso es obligatorio.");
        }

        var record = new PatientRecord(
            id,
            request.ReasonForVisit,
            request.CurrentCondition,
            request.Symptoms,
            request.Allergies,
            request.MedicalHistory,
            request.VitalSigns,
            request.PhysicalSheetReference,
            request.PhysicalSheetTranscript,
            request.Notes);

        _db.PatientRecords.Add(record);
        await _db.SaveChangesAsync(ct);

        return Created($"/api/patients/{id}/records/{record.Id}", new
        {
            record.Id,
            record.PatientId,
            record.ReasonForVisit,
            record.CurrentCondition,
            record.Symptoms,
            record.Allergies,
            record.MedicalHistory,
            record.VitalSigns,
            record.PhysicalSheetReference,
            record.PhysicalSheetTranscript,
            record.Notes,
            record.CreatedAtUtc
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var patient = await _db.Patients
            .FirstOrDefaultAsync(p => p.Id == id);

        if (patient is null)
        {
            return NotFound("Paciente no encontrado.");
        }

        _db.Patients.Remove(patient);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}
