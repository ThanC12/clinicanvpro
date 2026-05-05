using ClinicaProNV.Application.Appointments.Models;
using ClinicaProNV.Application.Appointments.UseCases;
using ClinicaProNV.Api.Contracts.Appointments;
using ClinicaProNV.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClinicaProNV.Application.Appointments.Ports;
using ClinicaProNV.Api.Services.WhatsApp;

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
                PatientEmail = db.Patients
                    .Where(p => p.Id == a.PatientId)
                    .Select(p => p.Email)
                    .FirstOrDefault(),
                PatientWhatsApp = db.Patients
                    .Where(p => p.Id == a.PatientId)
                    .Select(p => p.WhatsAppNumber)
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
        [FromServices] WhatsAppNotificationService whatsApp,
        CancellationToken ct)
    {
        var result = await useCase.ExecuteAsync(req, ct);
        await whatsApp.NotifyAppointmentCreatedAsync(result.Id, ct);

        return CreatedAtAction(nameof(Schedule), new { id = result.Id }, result);
    }

    // PUT /api/appointments/{id}
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        [FromRoute] Guid id,
        [FromBody] UpdateAppointmentRequest request,
        [FromServices] ClinicaProNVDbContext db,
        CancellationToken ct)
    {
        if (request is null)
        {
            return BadRequest("El cuerpo de la solicitud es obligatorio.");
        }

        var appointment = await db.Appointments.FirstOrDefaultAsync(a => a.Id == id, ct);

        if (appointment is null)
        {
            return NotFound("Cita no encontrada.");
        }

        var patientExists = await db.Patients.AnyAsync(p => p.Id == request.PatientId, ct);
        if (!patientExists)
        {
            return NotFound("El paciente seleccionado no existe.");
        }

        var doctorExists = await db.Doctors.AnyAsync(d => d.Id == request.DoctorId, ct);
        if (!doctorExists)
        {
            return NotFound("El doctor seleccionado no existe.");
        }

        appointment.Update(request.PatientId, request.DoctorId, request.Date, request.Reason);
        await db.SaveChangesAsync(ct);

        return Ok(new
        {
            appointment.Id,
            appointment.PatientId,
            appointment.DoctorId,
            appointment.Date,
            appointment.Reason,
            Status = (int)appointment.Status,
            StatusText = appointment.Status.ToString(),
            appointment.CreatedAtUtc
        });
    }

    // POST /api/appointments/{id}/complete
    [HttpPost("{id:guid}/complete")]
    public async Task<IActionResult> Complete(
        [FromRoute] Guid id,
        [FromServices] ClinicaProNVDbContext db,
        CancellationToken ct)
    {
        var appointment = await db.Appointments.FirstOrDefaultAsync(a => a.Id == id, ct);

        if (appointment is null)
        {
            return NotFound("Cita no encontrada.");
        }

        appointment.Complete();
        await db.SaveChangesAsync(ct);

        return NoContent();
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
