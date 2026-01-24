using Microsoft.AspNetCore.Mvc;

namespace ClinicaProNV.Api.Controllers.Pharmacy;

[ApiController]
[Route("api/pharmacy/invoices")]
public class PharmacyInvoiceController : ControllerBase
{
    [HttpPost]
    public IActionResult Create()
    {
        return Ok("Create pharmacy invoice");
    }

    [HttpGet("{id:int}")]
    public IActionResult GetById(int id)
    {
        return Ok($"Get pharmacy invoice {id}");
    }
}
