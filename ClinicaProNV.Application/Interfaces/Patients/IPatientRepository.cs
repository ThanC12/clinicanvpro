using ClinicaProNV.Domain.Entities;

namespace ClinicaProNV.Application.Interfaces.Patients;

public interface IPatientRepository
{
    Task AddAsync(Patient patient);
}
