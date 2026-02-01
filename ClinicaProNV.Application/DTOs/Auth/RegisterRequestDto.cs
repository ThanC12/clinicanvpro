namespace ClinicaProNV.Application.DTOs.Auth;

public sealed record RegisterRequestDto(string Email, string Password, string Role);
