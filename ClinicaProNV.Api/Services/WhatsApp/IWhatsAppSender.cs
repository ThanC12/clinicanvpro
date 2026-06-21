namespace ClinicaProNV.Api.Services.WhatsApp;

public interface IWhatsAppSender
{
    Task<bool> SendTemplateAsync(
        string to,
        string templateName,
        IReadOnlyList<string> bodyParameters,
        CancellationToken ct);
}
