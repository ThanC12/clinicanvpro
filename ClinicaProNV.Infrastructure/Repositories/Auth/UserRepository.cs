using ClinicaProNV.Application.Interfaces.Auth;
using ClinicaProNV.Domain.Entities;
using ClinicaProNV.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace ClinicaProNV.Infrastructure.Repositories.Auth;

public class UserRepository : IUserRepository
{
    private readonly ClinicaProNVDbContext _db;

    public UserRepository(ClinicaProNVDbContext db)
    {
        _db = db;
    }

    public async Task<User?> FindByEmailAsync(string email)
    {
        var normalized = email.Trim().ToLowerInvariant();

        return await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalized);
    }

    public async Task CreateAsync(User user)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
    }

    public async Task EnsureRoleAsync(string roleName)
    {
        var name = roleName.Trim();

        var exists = await _db.Roles.AnyAsync(r => r.Name == name);
        if (exists) return;

        _db.Roles.Add(new Role(name));
        await _db.SaveChangesAsync();
    }

    public async Task AssignRoleAsync(User user, string roleName)
    {
        var name = roleName.Trim();

        // Asegurar rol (sin crear 2 veces)
        var role = await _db.Roles.FirstOrDefaultAsync(r => r.Name == name);
        if (role is null)
        {
            role = new Role(name);
            _db.Roles.Add(role);
            await _db.SaveChangesAsync();
        }

        // Evitar duplicado en tabla puente
        var already = await _db.UserRoles.AnyAsync(ur =>
            ur.UserId == user.Id && ur.RoleId == role.Id);

        if (already) return;

        _db.UserRoles.Add(new UserRole(user.Id, role.Id));
        await _db.SaveChangesAsync();
    }

    public async Task<string?> GetPrimaryRoleAsync(User user)
    {
        return await _db.UserRoles
            .Where(ur => ur.UserId == user.Id)
            .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
            .AsNoTracking()
            .FirstOrDefaultAsync();
    }
}
