using ClinicaProNV.Api.Services.WhatsApp;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicaProNV.Api.Controllers.Notifications;

[ApiController]
[Route("api/notifications")]
[Authorize(Roles = "Admin")]
public class NotificationsController : ControllerBase
{
    private readonly IWhatsAppSender _whatsAppSender;

    public NotificationsController(IWhatsAppSender whatsAppSender)
    {
        _whatsAppSender = whatsAppSender;
    }

    [HttpPost("whatsapp/test")]
    public async Task<IActionResult> SendWhatsAppTest(
        [FromBody] SendWhatsAppTestRequest request,
        CancellationToken ct)
    {
        if (request is null)
        {
            return BadRequest("El cuerpo de la solicitud es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.To))
        {
            return BadRequest("Debe ingresar el número destino.");
        }

        if (string.IsNullOrWhiteSpace(request.TemplateName))
        {
            return BadRequest("Debe ingresar la plantilla.");
        }

        await _whatsAppSender.SendTemplateAsync(
            request.To,
            request.TemplateName,
            request.Parameters,
            ct);

        return Ok("Solicitud de WhatsApp procesada.");
    }

    public sealed class SendWhatsAppTestRequest
    {
        public string To { get; set; } = string.Empty;
        public string TemplateName { get; set; } = string.Empty;
        public List<string> Parameters { get; set; } = new();
    }
}
