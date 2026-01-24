using Microsoft.AspNetCore.Mvc;

namespace ClinicaProNV.Api.Controllers.Appointments;

[ApiController]
[Route("api/appointments")]
public class AppointmentsController : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll()
    {
        return Ok("List appointments");
    }

    [HttpPost]
    public IActionResult Create()
    {
        return Ok("Create appointment");
    }
}
