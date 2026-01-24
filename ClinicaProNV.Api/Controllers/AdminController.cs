// ClinicaProNV.Api/Controllers/AdminController.cs

using ClinicaProNV.Domain.Entities;
using ClinicaProNV.Infrastructure.Persistence.Context;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaProNV.Api.Controllers;

[ApiController]
[Route("api/admin")] // queda: /api/admin/users, /api/admin/roles, etc.
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
                u.CreatedAtUtc
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
            .Select(r => new { r.Id, r.Name })
            .ToListAsync();

        return Ok(roles);
    }

    // POST /api/admin/users/{userId}/assign-role/{roleName}
    [HttpPost("users/{userId:guid}/assign-role/{roleName}")]
    public async Task<IActionResult> AssignRole(Guid userId, string roleName)
    {
        roleName = roleName.Trim();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) return NotFound("Usuario no existe");

        var role = await _db.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
        if (role is null) return NotFound("Rol no existe");

        var already = await _db.UserRoles.AnyAsync(ur => ur.UserId == userId && ur.RoleId == role.Id);
        if (already) return Ok("Ya tenía ese rol");

        _db.UserRoles.Add(new UserRole(userId, role.Id));
        await _db.SaveChangesAsync();

        return Ok("Rol asignado");
    }
}
