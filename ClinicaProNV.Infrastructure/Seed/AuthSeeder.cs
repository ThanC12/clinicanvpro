using ClinicaProNV.Application.Security;
using ClinicaProNV.Domain.Entities;
using ClinicaProNV.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace ClinicaProNV.Infrastructure.Seed;

public static class AuthSeeder
{
    public static async Task SeedAsync(ClinicaProNVDbContext db, IPasswordHasher hasher)
    {
        // 1) Roles requeridos
        var roles = new[] { "Admin", "Recepcion", "Doctor", "Enfermeria", "Farmacia", "Cajero" };

        foreach (var roleName in roles)
        {
            var exists = await db.Roles.AnyAsync(r => r.Name == roleName);
            if (!exists)
            {
                // OJO: si Role es inmutable, esto no compilará.
                // Si tu Role tiene factory/constructor, aquí se usa ese.
                // Si NO lo tiene, se hace SQL directo (te dejo abajo alternativa).
            }
        }

        // 2) Crear admin si no existe
        var adminEmail = "admin@clinica.com";
        var admin = await db.Users.FirstOrDefaultAsync(u => u.Email == adminEmail);

        if (admin is null)
        {
            // Igual: depende de cómo sea tu entidad User (si es inmutable).
            // Te dejo abajo la alternativa realista con SQL.
        }
    }
}
