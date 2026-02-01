using System.Threading.Tasks;
using ClinicaProNV.Application.Interfaces.Appointments;
using ClinicaProNV.Domain.Entities;
using ClinicaProNV.Infrastructure.Persistence.Context;

namespace ClinicaProNV.Infrastructure.Repositories.Appointments;

public class AppointmentRepository : IAppointmentRepository
{
    private readonly ClinicaProNVDbContext _context;

    public AppointmentRepository(ClinicaProNVDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Appointment appointment)
    {
        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();
    }
}
