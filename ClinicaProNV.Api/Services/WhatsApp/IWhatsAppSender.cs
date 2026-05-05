namespace ClinicaProNV.Api.Services.WhatsApp;

public interface IWhatsAppSender
{
    Task SendTemplateAsync(
        string to,
        string templateName,
        IReadOnlyList<string> bodyParameters,
        CancellationToken ct);
}
