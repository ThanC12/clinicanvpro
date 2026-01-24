using ClinicaProNV.Application.DTOs.Auth;
using ClinicaProNV.Application.Interfaces.Auth;
using ClinicaProNV.Application.Security;
using ClinicaProNV.Domain.Entities;

namespace ClinicaProNV.Application.UseCases.Auth;

public class RegisterUseCase
{
    private readonly IUserRepository _repo;
    private readonly IPasswordHasher _hasher;

    public RegisterUseCase(IUserRepository repo, IPasswordHasher hasher)
    {
        _repo = repo;
        _hasher = hasher;
    }

    public async Task<(Guid userId, string email, string role)> ExecuteAsync(RegisterRequestDto req)
    {
        var existing = await _repo.FindByEmailAsync(req.Email);
        if (existing is not null)
            throw new InvalidOperationException("El usuario ya existe");

        var role = string.IsNullOrWhiteSpace(req.Role) ? "Recepcion" : req.Role;

        await _repo.EnsureRoleAsync(role);

        //  No uses object initializer porque tus propiedades son readonly/private set
        //  Crea el usuario con constructor/factory de la entidad
        var user = new User(req.Email, _hasher.Hash(req.Password));

        await _repo.CreateAsync(user);
        await _repo.AssignRoleAsync(user, role);

        return (user.Id, user.Email, role);
    }
}
