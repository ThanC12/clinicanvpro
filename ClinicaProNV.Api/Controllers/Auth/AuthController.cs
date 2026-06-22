using ClinicaProNV.Application.DTOs.Auth;
using ClinicaProNV.Application.Security;
using ClinicaProNV.Application.UseCases.Auth;
using ClinicaProNV.Infrastructure.Persistence.Context;
using ClinicaProNV.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;


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
    [Authorize(Roles = "Admin")]
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
        var (userId, email, role, mustChangePassword, temporaryPasswordExpiresAtUtc) = await login.ExecuteAsync(req);
        var token = jwt.GenerateToken(userId.ToString(), email, role);
        return Ok(new AuthResponseDto(
            userId,
            email,
            role,
            token,
            mustChangePassword,
            temporaryPasswordExpiresAtUtc));
    }

    [HttpPost("subscribe")]
    public async Task<IActionResult> Subscribe(
        [FromBody] SubscribeRequestDto req,
        [FromServices] RegisterUseCase register,
        [FromServices] IJwtTokenGenerator jwt)
    {
        if (req is null)
        {
            return BadRequest("El cuerpo de la solicitud es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
        {
            return BadRequest("Correo y contraseña son obligatorios.");
        }

        if (req.Password.Length < 6)
        {
            return BadRequest("La contraseña debe tener al menos 6 caracteres.");
        }

        var registerRequest = new RegisterRequestDto(req.Email.Trim(), req.Password, "Recepcion");
        var (userId, email, role) = await register.ExecuteAsync(registerRequest);
        var token = jwt.GenerateToken(userId.ToString(), email, role);

        return Ok(new AuthResponseDto(userId, email, role, token));
    }

    [Authorize]
    [HttpPost("change-my-temporary-password")]
    public async Task<IActionResult> ChangeMyTemporaryPassword(
        [FromBody] ChangeMyTemporaryPasswordRequest request,
        [FromServices] ClinicaProNVDbContext db,
        [FromServices] IPasswordHasher hasher,
        CancellationToken ct)
    {
        if (request is null)
        {
            return BadRequest("El cuerpo de la solicitud es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
            string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest("La contraseña temporal y la nueva contraseña son obligatorias.");
        }

        if (request.NewPassword.Length < 6)
        {
            return BadRequest("La nueva contraseña debe tener al menos 6 caracteres.");
        }

        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized("Token inválido.");
        }

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null || !user.IsActive)
        {
            return Unauthorized("Usuario inválido.");
        }

        if (!user.HasTemporaryPassword || user.TemporaryPasswordExpiresAtUtc is null)
        {
            return BadRequest("Este usuario no tiene contraseña temporal activa.");
        }

        if (user.TemporaryPasswordExpiresAtUtc <= DateTime.UtcNow)
        {
            return BadRequest("La contraseña temporal expiró. Solicite una nueva al administrador.");
        }

        if (!hasher.Verify(request.CurrentPassword, user.PasswordHash))
        {
            return BadRequest("La contraseña temporal no es correcta.");
        }

        user.ChangePassword(hasher.Hash(request.NewPassword));
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    [HttpPost("change-temporary-password")]
    public async Task<IActionResult> ChangeTemporaryPassword(
        [FromBody] ChangeTemporaryPasswordRequest request,
        [FromServices] ClinicaProNVDbContext db,
        [FromServices] IPasswordHasher hasher,
        CancellationToken ct)
    {
        if (request is null)
        {
            return BadRequest("El cuerpo de la solicitud es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.PhoneNumber) ||
            string.IsNullOrWhiteSpace(request.TemporaryPassword) ||
            string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest("Correo, teléfono, contraseña temporal y nueva contraseña son obligatorios.");
        }

        if (request.NewPassword.Length < 6)
        {
            return BadRequest("La nueva contraseña debe tener al menos 6 caracteres.");
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var phone = NormalizePhone(request.PhoneNumber);

        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null || !user.IsActive)
        {
            return BadRequest("Datos inválidos.");
        }

        if (!user.HasTemporaryPassword || user.TemporaryPasswordExpiresAtUtc is null)
        {
            return BadRequest("Este usuario no tiene contraseña temporal activa.");
        }

        if (user.TemporaryPasswordExpiresAtUtc <= DateTime.UtcNow)
        {
            return BadRequest("La contraseña temporal expiró. Solicite una nueva al administrador.");
        }

        if (NormalizePhone(user.PhoneNumber) != phone)
        {
            return BadRequest("El teléfono no coincide con el usuario.");
        }

        if (!hasher.Verify(request.TemporaryPassword, user.PasswordHash))
        {
            return BadRequest("La contraseña temporal no es correcta.");
        }

        user.ChangePassword(hasher.Hash(request.NewPassword));
        await db.SaveChangesAsync(ct);

        return NoContent();
    }

    private static string NormalizePhone(string value)
    {
        return new string((value ?? string.Empty).Where(char.IsDigit).ToArray());
    }

    public sealed record ChangeTemporaryPasswordRequest(
        string Email,
        string PhoneNumber,
        string TemporaryPassword,
        string NewPassword);

    public sealed record ChangeMyTemporaryPasswordRequest(
        string CurrentPassword,
        string NewPassword);
}
