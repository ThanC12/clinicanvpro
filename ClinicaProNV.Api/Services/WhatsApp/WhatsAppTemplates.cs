namespace ClinicaProNV.Api.Services.WhatsApp;

public sealed class WhatsAppTemplates
{
    public string AppointmentCreated { get; set; } = "cita_creada";
    public string ClinicInvoiceCreated { get; set; } = "factura_clinica";
    public string PharmacyInvoiceCreated { get; set; } = "factura_farmacia";
}
