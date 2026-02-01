using System;
using System.Threading.Tasks;
using ClinicaProNV.Application.Interfaces.Pharmacy;
using ClinicaProNV.Domain.Pharmacy;
using ClinicaProNV.Infrastructure.Persistence.Context;

namespace ClinicaProNV.Infrastructure.Repositories.Pharmacy;

public class MedicineRepository : IMedicineRepository
{
    private readonly ClinicaProNVDbContext _context;

    public MedicineRepository(ClinicaProNVDbContext context)
    {
        _context = context;
    }

    public async Task<Medicine?> GetByIdAsync(Guid id)
    {
        return await _context.Medicines.FindAsync(id);
    }
}
