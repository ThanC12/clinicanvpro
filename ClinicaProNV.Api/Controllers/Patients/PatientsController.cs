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

        var patient = new Patient(fullName, identification);

        _db.Patients.Add(patient);
        await _db.SaveChangesAsync();

        return Created($"/api/patients/{patient.Id}", new
        {
            patient.Id,
            patient.FullName,
            patient.Identification,
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

    patient.Update(request.FullName, identification);

    await _db.SaveChangesAsync();

    return Ok(new
    {
        patient.Id,
        patient.FullName,
        patient.Identification,
        patient.CreatedAtUtc
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