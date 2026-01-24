using ClinicaProNV.Domain.Pharmacy;

namespace ClinicaProNV.Application.Interfaces.Pharmacy;

public interface IMedicineRepository
{
    Task<Medicine?> GetByIdAsync(Guid id);
}
