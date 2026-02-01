using ClinicaProNV.Application.Appointments.Models;
using ClinicaProNV.Application.Appointments.UseCases;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicaProNV.Api.Controllers.Appointments;

[ApiController]
[Route("api/appointments")]
public sealed class AppointmentsController : ControllerBase
{
    // ====== GET ALL (demo) ======
    [HttpGet]
    public IActionResult GetAll()
    {
        return Ok("List appointments");
    }

    // ====== CREATE (demo) ======
    [HttpPost("create")]
    public IActionResult Create()
    {
        return Ok("Create appointment");
    }

    // ====== SCHEDULE (real) ======
    [HttpPost]
    [Authorize] // ajusta roles si quieres
    public async Task<ActionResult<AppointmentResponse>> Schedule(
        [FromBody] ScheduleAppointmentRequest req,
        [FromServices] ScheduleAppointmentUseCase useCase,
        CancellationToken ct)
    {
        var result = await useCase.ExecuteAsync(req, ct);
        return CreatedAtAction(nameof(Schedule), new { id = result.Id }, result);
    }

    // ====== CANCEL (real) ======
    [HttpPost("{id:guid}/cancel")]
    [Authorize]
    public async Task<IActionResult> Cancel(
        [FromRoute] Guid id,
        [FromBody] string? notes,
        [FromServices] CancelAppointmentUseCase useCase,
        CancellationToken ct)
    {
        await useCase.ExecuteAsync(id, notes, ct);
        return NoContent();
    }
}
