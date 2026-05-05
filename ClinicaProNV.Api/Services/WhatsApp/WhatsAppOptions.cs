namespace ClinicaProNV.Api.Services.WhatsApp;

public sealed class WhatsAppOptions
{
    public bool Enabled { get; set; }
    public string GraphApiVersion { get; set; } = "v20.0";
    public string PhoneNumberId { get; set; } = string.Empty;
    public string AccessToken { get; set; } = string.Empty;
    public string LanguageCode { get; set; } = "es";
    public WhatsAppTemplates Templates { get; set; } = new();
}
