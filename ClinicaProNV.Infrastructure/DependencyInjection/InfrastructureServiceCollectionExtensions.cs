using ClinicaProNV.Application.Interfaces.Auth;
using ClinicaProNV.Infrastructure.Repositories.Auth;
using Microsoft.Extensions.DependencyInjection;

namespace ClinicaProNV.Infrastructure.DependencyInjection;

public static class InfrastructureServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddScoped<IUserRepository, UserRepository>(); // ✅ ahora sí compila (porque implementa la interfaz)
        services.AddScoped<UserRepository>();                  // ✅ para AuthController si inyectas la clase concreta
        return services;
    }
}
