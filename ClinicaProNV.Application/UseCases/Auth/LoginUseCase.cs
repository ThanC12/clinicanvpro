using ClinicaProNV.Application.DTOs.Auth;
using ClinicaProNV.Application.Interfaces.Auth;
using ClinicaProNV.Application.Security;

namespace ClinicaProNV.Application.UseCases.Auth;

public class LoginUseCase
{
    private readonly IUserRepository _repo;
    private readonly IPasswordHasher _hasher;

    public LoginUseCase(IUserRepository repo, IPasswordHasher hasher)
    {
        _repo = repo;
        _hasher = hasher;
    }

    public async Task<(Guid userId, string email, string role)> ExecuteAsync(LoginRequestDto req)
    {
        var user = await _repo.FindByEmailAsync(req.Email);
        if (user is null || !user.IsActive)
            throw new InvalidOperationException("Credenciales inválidas");

        if (!_hasher.Verify(req.Password, user.PasswordHash))
            throw new InvalidOperationException("Credenciales inválidas");

        var role = await _repo.GetPrimaryRoleAsync(user) ?? "Recepcion";
        return (user.Id, user.Email, role);
    }
}
