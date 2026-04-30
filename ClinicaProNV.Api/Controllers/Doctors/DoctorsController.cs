using ClinicaProNV.Api.Contracts.Doctors;
using ClinicaProNV.Domain.Entities;
using ClinicaProNV.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaProNV.Api.Controllers.Doctors;

[ApiController]
[Route("api/doctors")]
[Authorize]
public class DoctorsController : ControllerBase
{
    private readonly ClinicaProNVDbContext _db;

    public DoctorsController(ClinicaProNVDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var doctors = await _db.Doctors
            .OrderByDescending(d => d.CreatedAtUtc)
            .Select(d => new
            {
                d.Id,
                d.FullName,
                d.Specialty,
                d.CreatedAtUtc
            })
            .ToListAsync();

        return Ok(doctors);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDoctorRequest request)
    {
        if (request is null)
        {
            return BadRequest("El cuerpo de la solicitud es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest("El nombre completo es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.Specialty))
        {
            return BadRequest("La especialidad es obligatoria.");
        }

        var fullName = request.FullName.Trim();
        var specialty = request.Specialty.Trim();

        var exists = await _db.Doctors
            .AnyAsync(d => d.FullName == fullName && d.Specialty == specialty);

        if (exists)
        {
            return Conflict("Ya existe un doctor con ese nombre y especialidad.");
        }

        var doctor = new Doctor(fullName, specialty);

        _db.Doctors.Add(doctor);
        await _db.SaveChangesAsync();

        return Created($"/api/doctors/{doctor.Id}", new
        {
            doctor.Id,
            doctor.FullName,
            doctor.Specialty,
            doctor.CreatedAtUtc
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDoctorRequest request)
    {
        if (request is null)
        {
            return BadRequest("El cuerpo de la solicitud es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest("El nombre completo es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.Specialty))
        {
            return BadRequest("La especialidad es obligatoria.");
        }

        var doctor = await _db.Doctors
            .FirstOrDefaultAsync(d => d.Id == id);

        if (doctor is null)
        {
            return NotFound("Doctor no encontrado.");
        }

        var fullName = request.FullName.Trim();
        var specialty = request.Specialty.Trim();

        var exists = await _db.Doctors
            .AnyAsync(d =>
                d.Id != id &&
                d.FullName == fullName &&
                d.Specialty == specialty);

        if (exists)
        {
            return Conflict("Ya existe otro doctor con ese nombre y especialidad.");
        }

        doctor.Update(fullName, specialty);

        await _db.SaveChangesAsync();

        return Ok(new
        {
            doctor.Id,
            doctor.FullName,
            doctor.Specialty,
            doctor.CreatedAtUtc
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var doctor = await _db.Doctors
            .FirstOrDefaultAsync(d => d.Id == id);

        if (doctor is null)
        {
            return NotFound("Doctor no encontrado.");
        }

        _db.Doctors.Remove(doctor);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}