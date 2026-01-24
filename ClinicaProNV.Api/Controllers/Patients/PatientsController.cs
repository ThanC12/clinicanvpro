using Microsoft.AspNetCore.Mvc;

namespace ClinicaProNV.Api.Controllers.Patients;

[ApiController]
[Route("api/patients")]
public class PatientsController : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll()
    {
        return Ok("List patients");
    }

    [HttpPost]
    public IActionResult Create()
    {
        return Ok("Create patient");
    }
}
