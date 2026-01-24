using ClinicaProNV.Application.DTOs.Auth;
using ClinicaProNV.Application.Security;
using ClinicaProNV.Application.UseCases.Auth;
using ClinicaProNV.Infrastructure.Persistence.Context;
using ClinicaProNV.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace ClinicaProNV.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    
    [HttpPost("seed-admin")]
    public async Task<IActionResult> SeedAdmin(
        [FromServices] ClinicaProNVDbContext db,
        [FromServices] IPasswordHasher hasher)
    {
        var roles = new[] { "Admin", "Recepcion", "Doctor", "Enfermeria", "Farmacia", "Cajero" };

        foreach (var roleName in roles)
        {
            if (!await db.Roles.AnyAsync(r => r.Name == roleName))
                db.Roles.Add(new Role(roleName));
        }

        await db.SaveChangesAsync();

        var email = "admin@clinica.com";
        var user = await db.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            user = new User(email, hasher.Hash("Admin123*"));
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }

        var adminRole = await db.Roles.FirstAsync(r => r.Name == "Admin");

        if (!await db.UserRoles.AnyAsync(ur => ur.UserId == user.Id && ur.RoleId == adminRole.Id))
        {
            db.UserRoles.Add(new UserRole(user.Id, adminRole.Id));
            await db.SaveChangesAsync();
        }

        return Ok(new { email, password = "Admin123*", role = "Admin" });
    }
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequestDto req,
        [FromServices] RegisterUseCase register,
        [FromServices] IJwtTokenGenerator jwt)
    {
        var (userId, email, role) = await register.ExecuteAsync(req);
        var token = jwt.GenerateToken(userId.ToString(), email, role);
        return Ok(new AuthResponseDto(userId, email, role, token));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequestDto req,
        [FromServices] LoginUseCase login,
        [FromServices] IJwtTokenGenerator jwt)
    {
        var (userId, email, role) = await login.ExecuteAsync(req);
        var token = jwt.GenerateToken(userId.ToString(), email, role);
        return Ok(new AuthResponseDto(userId, email, role, token));
    }
}
