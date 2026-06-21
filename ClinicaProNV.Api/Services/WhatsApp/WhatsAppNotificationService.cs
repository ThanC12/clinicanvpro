using ClinicaProNV.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ClinicaProNV.Api.Services.WhatsApp;

public sealed class WhatsAppNotificationService
{
    private readonly ClinicaProNVDbContext _db;
    private readonly IWhatsAppSender _sender;
    private readonly WhatsAppOptions _options;
    private readonly ILogger<WhatsAppNotificationService> _logger;

    public WhatsAppNotificationService(
        ClinicaProNVDbContext db,
        IWhatsAppSender sender,
        IOptions<WhatsAppOptions> options,
        ILogger<WhatsAppNotificationService> logger)
    {
        _db = db;
        _sender = sender;
        _options = options.Value;
        _logger = logger;
    }

    public async Task NotifyAppointmentCreatedAsync(Guid appointmentId, CancellationToken ct)
    {
        try
        {
            var data = await _db.Appointments
                .Where(appointment => appointment.Id == appointmentId)
                .Select(appointment => new
                {
                    PatientName = _db.Patients
                        .Where(patient => patient.Id == appointment.PatientId)
                        .Select(patient => patient.FullName)
                        .FirstOrDefault(),
                    PatientWhatsApp = _db.Patients
                        .Where(patient => patient.Id == appointment.PatientId)
                        .Select(patient => patient.WhatsAppNumber)
                        .FirstOrDefault(),
                    DoctorName = _db.Doctors
                        .Where(doctor => doctor.Id == appointment.DoctorId)
                        .Select(doctor => doctor.FullName)
                        .FirstOrDefault(),
                    appointment.Date,
                    appointment.Reason
                })
                .FirstOrDefaultAsync(ct);

            if (data is null || string.IsNullOrWhiteSpace(data.PatientWhatsApp))
            {
                return;
            }

            await _sender.SendTemplateAsync(
                data.PatientWhatsApp,
                _options.Templates.AppointmentCreated,
                new[]
                {
                    data.PatientName ?? "Paciente",
                    data.DoctorName ?? "Doctor",
                    data.Date.ToLocalTime().ToString("dd/MM/yyyy HH:mm"),
                    data.Reason
                },
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo enviar WhatsApp de cita {AppointmentId}.", appointmentId);
        }
    }

    public async Task NotifyClinicInvoiceCreatedAsync(Guid invoiceId, CancellationToken ct)
    {
        try
        {
            var data = await _db.ClinicInvoices
                .Where(invoice => invoice.Id == invoiceId)
                .Select(invoice => new
                {
                    PatientName = _db.Patients
                        .Where(patient => patient.Id == invoice.PatientId)
                        .Select(patient => patient.FullName)
                        .FirstOrDefault(),
                    PatientWhatsApp = _db.Patients
                        .Where(patient => patient.Id == invoice.PatientId)
                        .Select(patient => patient.WhatsAppNumber)
                        .FirstOrDefault(),
                    invoice.Total,
                    invoice.CreatedAtUtc
                })
                .FirstOrDefaultAsync(ct);

            if (data is null || string.IsNullOrWhiteSpace(data.PatientWhatsApp))
            {
                return;
            }

            await _sender.SendTemplateAsync(
                data.PatientWhatsApp,
                _options.Templates.ClinicInvoiceCreated,
                new[]
                {
                    data.PatientName ?? "Paciente",
                    invoiceId.ToString(),
                    data.CreatedAtUtc.ToLocalTime().ToString("dd/MM/yyyy HH:mm"),
                    data.Total.ToString("0.00")
                },
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo enviar WhatsApp de factura clínica {InvoiceId}.", invoiceId);
        }
    }

    public async Task NotifyPharmacyInvoiceCreatedAsync(Guid invoiceId, CancellationToken ct)
    {
        try
        {
            var data = await _db.PharmacyInvoices
                .Where(invoice => invoice.Id == invoiceId)
                .Select(invoice => new
                {
                    PatientName = _db.Patients
                        .Where(patient => patient.Id == invoice.PatientId)
                        .Select(patient => patient.FullName)
                        .FirstOrDefault(),
                    PatientWhatsApp = _db.Patients
                        .Where(patient => patient.Id == invoice.PatientId)
                        .Select(patient => patient.WhatsAppNumber)
                        .FirstOrDefault(),
                    invoice.Total,
                    invoice.CreatedAtUtc
                })
                .FirstOrDefaultAsync(ct);

            if (data is null || string.IsNullOrWhiteSpace(data.PatientWhatsApp))
            {
                return;
            }

            await _sender.SendTemplateAsync(
                data.PatientWhatsApp,
                _options.Templates.PharmacyInvoiceCreated,
                new[]
                {
                    data.PatientName ?? "Paciente",
                    invoiceId.ToString(),
                    data.CreatedAtUtc.ToLocalTime().ToString("dd/MM/yyyy HH:mm"),
                    data.Total.ToString("0.00")
                },
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo enviar WhatsApp de factura farmacia {InvoiceId}.", invoiceId);
        }
    }

    public async Task<bool> NotifyTemporaryPasswordAsync(
        string phoneNumber,
        string email,
        string temporaryPassword,
        DateTime expiresAtUtc,
        CancellationToken ct)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(phoneNumber))
            {
                return false;
            }

            return await _sender.SendTemplateAsync(
                phoneNumber,
                _options.Templates.TemporaryPassword,
                new[]
                {
                    email,
                    temporaryPassword,
                    expiresAtUtc.ToLocalTime().ToString("HH:mm")
                },
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo enviar WhatsApp de contraseña temporal a {Email}.", email);
            return false;
        }
    }
}
