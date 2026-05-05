using ClinicaProNV.Domain.Entities;
using ClinicaProNV.Application.Security;
using ClinicaProNV.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaProNV.Api.Controllers.Admin;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
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
                u.IsActive,
                u.CreatedAtUtc,
                Roles = u.UserRoles
                    .Select(ur => ur.Role.Name)
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

    // POST /api/admin/users
    [HttpPost("users")]
    public async Task<IActionResult> CreateUser(
        [FromBody] CreateUserRequest request,
        [FromServices] IPasswordHasher hasher)
    {
        if (request is null)
        {
            return BadRequest("El cuerpo de la solicitud es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest("El correo es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("La contraseña es obligatoria.");
        }

        if (request.Password.Length < 6)
        {
            return BadRequest("La contraseña debe tener al menos 6 caracteres.");
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var roleName = string.IsNullOrWhiteSpace(request.Role) ? "Recepcion" : request.Role.Trim();

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

        var user = new User(email, hasher.Hash(request.Password));
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        _db.UserRoles.Add(new UserRole(user.Id, role.Id));
        await _db.SaveChangesAsync();

        return Created($"/api/admin/users/{user.Id}", new
        {
            user.Id,
            user.Email,
            user.IsActive,
            user.CreatedAtUtc,
            Roles = new[] { role.Name }
        });
    }

    // DELETE /api/admin/users/{userId}/roles/{roleName}
    [HttpDelete("users/{userId:guid}/roles/{roleName}")]
    public async Task<IActionResult> RemoveRole(Guid userId, string roleName)
    {
        roleName = roleName.Trim();

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

    public sealed record CreateUserRequest(string Email, string Password, string Role);
}
