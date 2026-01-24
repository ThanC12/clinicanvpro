using Microsoft.AspNetCore.Mvc;

namespace ClinicaProNV.Api.Controllers.Billing;

[ApiController]
[Route("api/billing/invoices")]
public class ClinicInvoiceController : ControllerBase
{
    [HttpPost]
    public IActionResult Create()
    {
        return Ok("Create clinic invoice");
    }

    [HttpGet("{id:int}")]
    public IActionResult GetById(int id)
    {
        return Ok($"Get clinic invoice {id}");
    }
}
