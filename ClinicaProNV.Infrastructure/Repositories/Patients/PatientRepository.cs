using System.Threading.Tasks;
using ClinicaProNV.Application.Interfaces.Patients;
using ClinicaProNV.Domain.Entities;
using ClinicaProNV.Infrastructure.Persistence.Context;

namespace ClinicaProNV.Infrastructure.Repositories.Patients;

public class PatientRepository : IPatientRepository
{
    private readonly ClinicaProNVDbContext _context;

    public PatientRepository(ClinicaProNVDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Patient patient)
    {
        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();
    }
}
