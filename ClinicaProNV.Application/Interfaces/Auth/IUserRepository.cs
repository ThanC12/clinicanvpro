using ClinicaProNV.Domain.Entities;

namespace ClinicaProNV.Application.Interfaces.Auth;

public interface IUserRepository
{
    Task<User?> FindByEmailAsync(string email);
    Task CreateAsync(User user);
    Task EnsureRoleAsync(string roleName);
    Task AssignRoleAsync(User user, string roleName);
    Task<string?> GetPrimaryRoleAsync(User user);
}
