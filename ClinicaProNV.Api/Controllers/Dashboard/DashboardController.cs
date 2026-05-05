using ClinicaProNV.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaProNV.Api.Controllers.Dashboard;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ClinicaProNVDbContext _db;

    public DashboardController(ClinicaProNVDbContext db)
    {
        _db = db;
    }

    [HttpGet("sales")]
    public async Task<IActionResult> GetSales(CancellationToken ct)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        var lastSevenDays = today.AddDays(-6);

        var clinicToday = await _db.ClinicInvoices
            .Where(invoice => invoice.CreatedAtUtc >= today && invoice.CreatedAtUtc < tomorrow)
            .SumAsync(invoice => invoice.Total, ct);

        var pharmacyToday = await _db.PharmacyInvoices
            .Where(invoice => invoice.CreatedAtUtc >= today && invoice.CreatedAtUtc < tomorrow)
            .SumAsync(invoice => invoice.Total, ct);

        var clinicTotal = await _db.ClinicInvoices.SumAsync(invoice => invoice.Total, ct);
        var pharmacyTotal = await _db.PharmacyInvoices.SumAsync(invoice => invoice.Total, ct);

        var clinicInvoicesToday = await _db.ClinicInvoices
            .CountAsync(invoice => invoice.CreatedAtUtc >= today && invoice.CreatedAtUtc < tomorrow, ct);

        var pharmacyInvoicesToday = await _db.PharmacyInvoices
            .CountAsync(invoice => invoice.CreatedAtUtc >= today && invoice.CreatedAtUtc < tomorrow, ct);

        var topClinicalServices = await _db.ClinicInvoiceDetails
            .GroupBy(detail => detail.Description)
            .Select(group => new
            {
                Name = group.Key,
                Quantity = group.Sum(detail => detail.Quantity),
                Total = group.Sum(detail => detail.LineTotal)
            })
            .OrderByDescending(item => item.Total)
            .Take(8)
            .ToListAsync(ct);

        var topMedicines = await _db.PharmacyInvoiceDetails
            .GroupBy(detail => detail.MedicineId)
            .Select(group => new
            {
                MedicineId = group.Key,
                Name = _db.Medicines
                    .Where(medicine => medicine.Id == group.Key)
                    .Select(medicine => medicine.Name)
                    .FirstOrDefault(),
                Quantity = group.Sum(detail => detail.Quantity),
                Total = group.Sum(detail => detail.LineTotal)
            })
            .OrderByDescending(item => item.Total)
            .Take(8)
            .ToListAsync(ct);

        var dailyClinic = await _db.ClinicInvoices
            .Where(invoice => invoice.CreatedAtUtc >= lastSevenDays)
            .GroupBy(invoice => invoice.CreatedAtUtc.Date)
            .Select(group => new
            {
                Date = group.Key,
                ClinicTotal = group.Sum(invoice => invoice.Total)
            })
            .ToListAsync(ct);

        var dailyPharmacy = await _db.PharmacyInvoices
            .Where(invoice => invoice.CreatedAtUtc >= lastSevenDays)
            .GroupBy(invoice => invoice.CreatedAtUtc.Date)
            .Select(group => new
            {
                Date = group.Key,
                PharmacyTotal = group.Sum(invoice => invoice.Total)
            })
            .ToListAsync(ct);

        var dailySales = Enumerable.Range(0, 7)
            .Select(offset => lastSevenDays.AddDays(offset))
            .Select(day => new
            {
                Date = day,
                ClinicTotal = dailyClinic.FirstOrDefault(item => item.Date == day)?.ClinicTotal ?? 0,
                PharmacyTotal = dailyPharmacy.FirstOrDefault(item => item.Date == day)?.PharmacyTotal ?? 0
            })
            .Select(day => new
            {
                day.Date,
                day.ClinicTotal,
                day.PharmacyTotal,
                Total = day.ClinicTotal + day.PharmacyTotal
            })
            .ToList();

        return Ok(new
        {
            Today = new
            {
                ClinicTotal = clinicToday,
                PharmacyTotal = pharmacyToday,
                Total = clinicToday + pharmacyToday,
                Invoices = clinicInvoicesToday + pharmacyInvoicesToday
            },
            AllTime = new
            {
                ClinicTotal = clinicTotal,
                PharmacyTotal = pharmacyTotal,
                Total = clinicTotal + pharmacyTotal
            },
            TopClinicalServices = topClinicalServices,
            TopMedicines = topMedicines,
            DailySales = dailySales
        });
    }
}
