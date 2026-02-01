using ClinicaProNV.Application.Appointments.Ports;
using ClinicaProNV.Domain.Entities;
using ClinicaProNV.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace ClinicaProNV.Infrastructure.Appointments;

public sealed class AppointmentRepository : IAppointmentRepository
{
    private readonly ClinicaProNVDbContext _db;

    public AppointmentRepository(ClinicaProNVDbContext db)
    {
        _db = db;
    }

    public Task<Appointment?> GetByIdAsync(Guid id, CancellationToken ct) =>
        _db.Appointments.FirstOrDefaultAsync(x => x.Id == id, ct);

    public async Task<IReadOnlyList<Appointment>> GetByPatientAsync(Guid patientId, CancellationToken ct) =>
        await _db.Appointments
            .Where(x => x.PatientId == patientId)
            .OrderByDescending(x => x.Date)
            .ToListAsync(ct);

    public async Task AddAsync(Appointment appointment, CancellationToken ct)
    {
        _db.Appointments.Add(appointment);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Appointment appointment, CancellationToken ct)
    {
        _db.Appointments.Update(appointment);
        await _db.SaveChangesAsync(ct);
    }
}
