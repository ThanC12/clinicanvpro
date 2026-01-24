using ClinicaProNV.Application.DTOs.Patients;
using ClinicaProNV.Application.Interfaces.Patients;
using ClinicaProNV.Domain.Entities;

namespace ClinicaProNV.Application.UseCases.Patients;

public class CreatePatientUseCase
{
    private readonly IPatientRepository _repository;

    public CreatePatientUseCase(IPatientRepository repository)
    {
        _repository = repository;
    }

    public async Task ExecuteAsync(CreatePatientDto dto)
    {
        var patient = new Patient(dto.FullName, dto.Identification);
        await _repository.AddAsync(patient);
    }
}
