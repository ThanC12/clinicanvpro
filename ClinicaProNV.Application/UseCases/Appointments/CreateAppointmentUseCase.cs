using ClinicaProNV.Application.DTOs.Appointments;
using ClinicaProNV.Application.Interfaces.Appointments;
using ClinicaProNV.Domain.Entities;

namespace ClinicaProNV.Application.UseCases.Appointments;

public class CreateAppointmentUseCase
{
    private readonly IAppointmentRepository _repository;

    public CreateAppointmentUseCase(IAppointmentRepository repository)
    {
        _repository = repository;
    }

    public async Task ExecuteAsync(CreateAppointmentDto dto)
    {
        var appointment = new Appointment(dto.PatientId, dto.Date);
        await _repository.AddAsync(appointment);
    }
}
