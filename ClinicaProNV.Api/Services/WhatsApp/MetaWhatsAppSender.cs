using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.Options;

namespace ClinicaProNV.Api.Services.WhatsApp;

public sealed class MetaWhatsAppSender : IWhatsAppSender
{
    private readonly HttpClient _httpClient;
    private readonly WhatsAppOptions _options;
    private readonly ILogger<MetaWhatsAppSender> _logger;

    public MetaWhatsAppSender(
        HttpClient httpClient,
        IOptions<WhatsAppOptions> options,
        ILogger<MetaWhatsAppSender> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task SendTemplateAsync(
        string to,
        string templateName,
        IReadOnlyList<string> bodyParameters,
        CancellationToken ct)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("WhatsApp desactivado. Plantilla {Template} no enviada.", templateName);
            return;
        }

        var phone = NormalizePhone(to);

        if (string.IsNullOrWhiteSpace(phone))
        {
            _logger.LogWarning("WhatsApp no enviado: número vacío.");
            return;
        }

        if (string.IsNullOrWhiteSpace(_options.PhoneNumberId) ||
            string.IsNullOrWhiteSpace(_options.AccessToken))
        {
            _logger.LogWarning("WhatsApp no enviado: falta PhoneNumberId o AccessToken.");
            return;
        }

        var payload = new
        {
            messaging_product = "whatsapp",
            to = phone,
            type = "template",
            template = new
            {
                name = templateName,
                language = new
                {
                    code = _options.LanguageCode
                },
                components = new[]
                {
                    new
                    {
                        type = "body",
                        parameters = bodyParameters
                            .Select(value => new
                            {
                                type = "text",
                                text = value
                            })
                            .ToArray()
                    }
                }
            }
        };

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"https://graph.facebook.com/{_options.GraphApiVersion}/{_options.PhoneNumberId}/messages");

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.AccessToken);
        request.Content = JsonContent.Create(payload);

        using var response = await _httpClient.SendAsync(request, ct);
        var responseText = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning(
                "WhatsApp falló con status {StatusCode}: {Response}",
                response.StatusCode,
                responseText);
            return;
        }

        _logger.LogInformation("WhatsApp enviado con plantilla {Template} a {Phone}.", templateName, phone);
    }

    private static string NormalizePhone(string value)
    {
        return new string(value.Where(char.IsDigit).ToArray());
    }
}
