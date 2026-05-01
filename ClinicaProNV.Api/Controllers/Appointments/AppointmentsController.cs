using ClinicaProNV.Application.Appointments.Models;
using ClinicaProNV.Application.Appointments.UseCases;
using ClinicaProNV.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClinicaProNV.Application.Appointments.Ports;

namespace ClinicaProNV.Api.Controllers.Appointments;

[ApiController]
[Route("api/appointments")]
[Authorize]
public sealed class AppointmentsController : ControllerBase
{
    // GET /api/appointments
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromServices] ClinicaProNVDbContext db,
        CancellationToken ct)
    {
        var appointments = await db.Appointments
            .OrderByDescending(a => a.CreatedAtUtc)
            .Select(a => new
            {
                a.Id,
                a.PatientId,
                PatientName = db.Patients
                    .Where(p => p.Id == a.PatientId)
                    .Select(p => p.FullName)
                    .FirstOrDefault(),

                a.DoctorId,
                DoctorName = db.Doctors
                    .Where(d => d.Id == a.DoctorId)
                    .Select(d => d.FullName)
                    .FirstOrDefault(),

                DoctorSpecialty = db.Doctors
                    .Where(d => d.Id == a.DoctorId)
                    .Select(d => d.Specialty)
                    .FirstOrDefault(),

                a.Date,
                a.Reason,
                Status = (int)a.Status,
                StatusText = a.Status.ToString(),
                a.CreatedAtUtc
            })
            .ToListAsync(ct);

        return Ok(appointments);
    }

    // POST /api/appointments
    [HttpPost]
    public async Task<ActionResult<AppointmentResponse>> Schedule(
        [FromBody] ScheduleAppointmentRequest req,
        [FromServices] ScheduleAppointmentUseCase useCase,
        CancellationToken ct)
    {
        var result = await useCase.ExecuteAsync(req, ct);

        return CreatedAtAction(nameof(Schedule), new { id = result.Id }, result);
    }

    // POST /api/appointments/{id}/cancel
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(
        [FromRoute] Guid id,
        [FromBody] string? notes,
        [FromServices] CancelAppointmentUseCase useCase,
        CancellationToken ct)
    {
        await useCase.ExecuteAsync(id, notes, ct);

        return NoContent();
    }
    // DELETE /api/appointments/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        [FromRoute] Guid id,
        [FromServices] IAppointmentRepository appointmentRepository,
        CancellationToken ct)
    {
        await appointmentRepository.DeleteAsync(id, ct);

        return NoContent();
    }
}