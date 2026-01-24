using ClinicaProNV.Domain.Entities;
using ClinicaProNV.Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace ClinicaProNV.Infrastructure.Persistence.Seed;

public static class DbSeeder
{
    public static async Task SeedAsync(ClinicaProNVDbContext db)
    {
        // Roles base
        var roles = new[] { "Admin", "Doctor", "Cashier", "Pharmacist" };

        foreach (var roleName in roles)
        {
            var exists = await db.Roles.AnyAsync(r => r.Name == roleName);
            if (!exists)
                db.Roles.Add(new Role(roleName));
        }

        await db.SaveChangesAsync();
    }
}
