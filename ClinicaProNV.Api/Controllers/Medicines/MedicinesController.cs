using ClinicaProNV.Api.Contracts.Medicines;
using ClinicaProNV.Domain.Pharmacy;
using ClinicaProNV.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaProNV.Api.Controllers.Medicines;

[ApiController]
[Route("api/medicines")]
[Authorize]
public class MedicinesController : ControllerBase
{
    private readonly ClinicaProNVDbContext _db;

    public MedicinesController(ClinicaProNVDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var medicines = await _db.Medicines
            .OrderByDescending(m => m.CreatedAtUtc)
            .Select(m => new
            {
                m.Id,
                m.Name,
                m.UnitPrice,
                m.Stock,
                m.RequiresPrescription,
                m.CreatedAtUtc
            })
            .ToListAsync(ct);

        return Ok(medicines);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateMedicineRequest request,
        CancellationToken ct)
    {
        if (request is null)
            return BadRequest("El cuerpo de la solicitud es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("El nombre del medicamento es obligatorio.");

        if (request.UnitPrice <= 0)
            return BadRequest("El precio unitario debe ser mayor a cero.");

        if (request.Stock < 0)
            return BadRequest("El stock no puede ser negativo.");

        var name = request.Name.Trim();

        var exists = await _db.Medicines
            .AnyAsync(m => m.Name.ToLower() == name.ToLower(), ct);

        if (exists)
            return Conflict("Ya existe un medicamento con ese nombre.");

        var medicine = new Medicine(
            name,
            request.UnitPrice,
            request.Stock,
            request.RequiresPrescription
        );

        _db.Medicines.Add(medicine);
        await _db.SaveChangesAsync(ct);

        return Created($"/api/medicines/{medicine.Id}", new
        {
            medicine.Id,
            medicine.Name,
            medicine.UnitPrice,
            medicine.Stock,
            medicine.RequiresPrescription,
            medicine.CreatedAtUtc
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateMedicineRequest request,
        CancellationToken ct)
    {
        if (request is null)
            return BadRequest("El cuerpo de la solicitud es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("El nombre del medicamento es obligatorio.");

        if (request.UnitPrice <= 0)
            return BadRequest("El precio unitario debe ser mayor a cero.");

        if (request.Stock < 0)
            return BadRequest("El stock no puede ser negativo.");

        var medicine = await _db.Medicines
            .FirstOrDefaultAsync(m => m.Id == id, ct);

        if (medicine is null)
            return NotFound("Medicamento no encontrado.");

        var name = request.Name.Trim();

        var exists = await _db.Medicines
            .AnyAsync(m => m.Id != id && m.Name.ToLower() == name.ToLower(), ct);

        if (exists)
            return Conflict("Ya existe otro medicamento con ese nombre.");

        medicine.Update(
            name,
            request.UnitPrice,
            request.Stock,
            request.RequiresPrescription
        );

        await _db.SaveChangesAsync(ct);

        return Ok(new
        {
            medicine.Id,
            medicine.Name,
            medicine.UnitPrice,
            medicine.Stock,
            medicine.RequiresPrescription,
            medicine.CreatedAtUtc
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var medicine = await _db.Medicines
            .FirstOrDefaultAsync(m => m.Id == id, ct);

        if (medicine is null)
            return NotFound("Medicamento no encontrado.");

        _db.Medicines.Remove(medicine);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }
}