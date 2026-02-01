namespace ClinicaProNV.Application.DTOs.Auth;

public sealed record AuthResponseDto(Guid UserId, string Email, string Role, string Token);