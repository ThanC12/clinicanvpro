namespace ClinicaProNV.Application.Security;

public interface IJwtTokenGenerator
{
    string GenerateToken(string userId, string email, string role);
}
