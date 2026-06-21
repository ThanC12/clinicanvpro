using ClinicaProNV.Domain.Entities;
using ClinicaProNV.Application.Security;
using ClinicaProNV.Api.Services.WhatsApp;
using ClinicaProNV.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace ClinicaProNV.Api.Controllers.Admin;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private static readonly string[] AllowedRoles =
    {
        "Admin",
        "Recepcion",
        "Doctor",
        "Enfermeria",
        "Farmacia",
        "Cajero"
    };

    private readonly ClinicaProNVDbContext _db;

    public AdminController(ClinicaProNVDbContext db)
    {
        _db = db;
    }

    // GET /api/admin/users
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _db.Users
            .OrderBy(u => u.Email)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.PhoneNumber,
                u.HasTemporaryPassword,
                u.TemporaryPasswordExpiresAtUtc,
                u.IsActive,
                u.CreatedAtUtc,
                Roles = u.UserRoles
                    .Select(ur => ur.Role.Name)
                    .Where(name => AllowedRoles.Contains(name))
                    .Distinct()
                    .OrderBy(name => name)
                    .ToList()
            })
            .ToListAsync();

        return Ok(users);
    }

    // GET /api/admin/roles
    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _db.Roles
            .Where(r => AllowedRoles.Contains(r.Name))
            .OrderBy(r => r.Name)
            .Select(r => new
            {
                r.Id,
                r.Name
            })
            .ToListAsync();

        return Ok(roles);
    }

    // POST /api/admin/users/{userId}/assign-role/{roleName}
    [HttpPost("users/{userId:guid}/assign-role/{roleName}")]
    public async Task<IActionResult> AssignRole(Guid userId, string roleName)
    {
        if (string.IsNullOrWhiteSpace(roleName))
        {
            return BadRequest("El nombre del rol es obligatorio.");
        }

        roleName = roleName.Trim();

        if (!AllowedRoles.Contains(roleName))
        {
            return BadRequest("Rol no permitido.");
        }

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
        {
            return NotFound("Usuario no existe.");
        }

        var role = await _db.Roles
            .FirstOrDefaultAsync(r => r.Name == roleName);

        if (role is null)
        {
            return NotFound("Rol no existe.");
        }

        var already = await _db.UserRoles
            .AnyAsync(ur => ur.UserId == userId && ur.RoleId == role.Id);

        if (already)
        {
            return Ok("Ya tenía ese rol.");
        }

        _db.UserRoles.Add(new UserRole(userId, role.Id));
        await _db.SaveChangesAsync();

        return Ok("Rol asignado.");
    }

    // PUT /api/admin/users/{userId}
    [HttpPut("users/{userId:guid}")]
    public async Task<IActionResult> UpdateUser(Guid userId, [FromBody] UpdateUserRequest request)
    {
        if (request is null)
        {
            return BadRequest("El cuerpo de la solicitud es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            return BadRequest("El teléfono/WhatsApp es obligatorio.");
        }

        var roleNames = request.Roles
            .Where(role => !string.IsNullOrWhiteSpace(role))
            .Select(role => role.Trim())
            .Distinct()
            .ToList();

        if (roleNames.Count == 0)
        {
            return BadRequest("Seleccione al menos un rol.");
        }

        if (roleNames.Any(role => !AllowedRoles.Contains(role)))
        {
            return BadRequest("Uno o más roles no están permitidos.");
        }

        var user = await _db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
        {
            return NotFound("Usuario no existe.");
        }

        var roles = await _db.Roles
            .Where(role => roleNames.Contains(role.Name))
            .ToListAsync();

        if (roles.Count != roleNames.Count)
        {
            return NotFound("Uno o más roles no existen.");
        }

        user.UpdatePhoneNumber(request.PhoneNumber);
        _db.UserRoles.RemoveRange(user.UserRoles);

        foreach (var role in roles)
        {
            _db.UserRoles.Add(new UserRole(user.Id, role.Id));
        }

        await _db.SaveChangesAsync();

        return Ok(new
        {
            user.Id,
            user.Email,
            user.PhoneNumber,
            user.HasTemporaryPassword,
            user.TemporaryPasswordExpiresAtUtc,
            user.IsActive,
            user.CreatedAtUtc,
            Roles = roles
                .Select(role => role.Name)
                .OrderBy(name => name)
                .ToList()
        });
    }

    // POST /api/admin/users
    [HttpPost("users")]
    public async Task<IActionResult> CreateUser(
        [FromBody] CreateUserRequest request,
        [FromServices] IPasswordHasher hasher,
        [FromServices] WhatsAppNotificationService whatsApp,
        CancellationToken ct)
    {
        if (request is null)
        {
            return BadRequest("El cuerpo de la solicitud es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest("El correo es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            return BadRequest("El teléfono/WhatsApp es obligatorio para enviar la contraseña temporal.");
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var roleName = string.IsNullOrWhiteSpace(request.Role) ? "Recepcion" : request.Role.Trim();

        if (!AllowedRoles.Contains(roleName))
        {
            return BadRequest("Rol no permitido.");
        }

        var exists = await _db.Users.AnyAsync(u => u.Email == email);
        if (exists)
        {
            return Conflict("Ya existe un usuario con ese correo.");
        }

        var role = await _db.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
        if (role is null)
        {
            return NotFound("Rol no existe.");
        }

        var temporaryPassword = GenerateTemporaryPassword();
        var expiresAtUtc = DateTime.UtcNow.AddMinutes(5);

        var user = new User(
            email,
            hasher.Hash(temporaryPassword),
            request.PhoneNumber,
            expiresAtUtc);
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        _db.UserRoles.Add(new UserRole(user.Id, role.Id));
        await _db.SaveChangesAsync(ct);

        var whatsAppSent = await whatsApp.NotifyTemporaryPasswordAsync(
            user.PhoneNumber,
            user.Email,
            temporaryPassword,
            expiresAtUtc,
            ct);

        return Created($"/api/admin/users/{user.Id}", new
        {
            user.Id,
            user.Email,
            user.PhoneNumber,
            user.HasTemporaryPassword,
            user.TemporaryPasswordExpiresAtUtc,
            WhatsAppSent = whatsAppSent,
            TemporaryPassword = whatsAppSent ? null : temporaryPassword,
            user.IsActive,
            user.CreatedAtUtc,
            Roles = new[] { role.Name }
        });
    }

    private static string GenerateTemporaryPassword()
    {
        const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        Span<byte> bytes = stackalloc byte[10];
        RandomNumberGenerator.Fill(bytes);

        var chars = bytes
            .ToArray()
            .Select(value => alphabet[value % alphabet.Length])
            .ToArray();

        return new string(chars);
    }

    // POST /api/admin/users/{userId}/temporary-password
    [HttpPost("users/{userId:guid}/temporary-password")]
    public async Task<IActionResult> GenerateTemporaryPasswordForExistingUser(
        Guid userId,
        [FromServices] IPasswordHasher hasher,
        [FromServices] WhatsAppNotificationService whatsApp,
        CancellationToken ct)
    {
        var user = await _db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user is null)
        {
            return NotFound("Usuario no existe.");
        }

        if (!user.IsActive)
        {
            return BadRequest("El usuario está inactivo.");
        }

        if (string.IsNullOrWhiteSpace(user.PhoneNumber))
        {
            return BadRequest("El usuario no tiene WhatsApp registrado.");
        }

        var temporaryPassword = GenerateTemporaryPassword();
        var expiresAtUtc = DateTime.UtcNow.AddMinutes(5);

        user.SetTemporaryPassword(hasher.Hash(temporaryPassword), expiresAtUtc);
        await _db.SaveChangesAsync(ct);

        var whatsAppSent = await whatsApp.NotifyTemporaryPasswordAsync(
            user.PhoneNumber,
            user.Email,
            temporaryPassword,
            expiresAtUtc,
            ct);

        return Ok(new
        {
            user.Id,
            user.Email,
            user.PhoneNumber,
            user.HasTemporaryPassword,
            user.TemporaryPasswordExpiresAtUtc,
            WhatsAppSent = whatsAppSent,
            TemporaryPassword = whatsAppSent ? null : temporaryPassword,
            user.IsActive,
            user.CreatedAtUtc,
            Roles = user.UserRoles
                .Select(userRole => userRole.Role.Name)
                .Where(name => AllowedRoles.Contains(name))
                .Distinct()
                .OrderBy(name => name)
                .ToList()
        });
    }

    // DELETE /api/admin/users/{userId}/roles/{roleName}
    [HttpDelete("users/{userId:guid}/roles/{roleName}")]
    public async Task<IActionResult> RemoveRole(Guid userId, string roleName)
    {
        roleName = roleName.Trim();

        if (!AllowedRoles.Contains(roleName))
        {
            return BadRequest("Rol no permitido.");
        }

        var role = await _db.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
        if (role is null)
        {
            return NotFound("Rol no existe.");
        }

        var userRole = await _db.UserRoles
            .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleId == role.Id);

        if (userRole is null)
        {
            return NotFound("El usuario no tiene ese rol.");
        }

        _db.UserRoles.Remove(userRole);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // POST /api/admin/users/{userId}/activate
    [HttpPost("users/{userId:guid}/activate")]
    public async Task<IActionResult> ActivateUser(Guid userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
        {
            return NotFound("Usuario no existe.");
        }

        user.Activate();
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // POST /api/admin/users/{userId}/deactivate
    [HttpPost("users/{userId:guid}/deactivate")]
    public async Task<IActionResult> DeactivateUser(Guid userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
        {
            return NotFound("Usuario no existe.");
        }

        user.Deactivate();
        await _db.SaveChangesAsync();

        return NoContent();
    }

    public sealed record CreateUserRequest(string Email, string PhoneNumber, string Role);
    public sealed record UpdateUserRequest(string PhoneNumber, IReadOnlyCollection<string> Roles);
}
