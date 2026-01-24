// Program.cs (ClinicaProNV.Api)

using ClinicaProNV.Api.Middlewares;
using ClinicaProNV.Application.Interfaces.Auth;
using ClinicaProNV.Application.Security;
using ClinicaProNV.Application.UseCases.Auth;
using ClinicaProNV.Infrastructure.Persistence.Context;
using ClinicaProNV.Infrastructure.Repositories.Auth;
using ClinicaProNV.Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// DB
builder.Services.AddDbContext<ClinicaProNVDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// DI Repos + Security
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();

// DI UseCases (IMPORTANTE: si no registras esto, te dará 500/DI errors)
builder.Services.AddScoped<RegisterUseCase>();
builder.Services.AddScoped<LoginUseCase>();

// JWT Settings
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()!;
if (string.IsNullOrWhiteSpace(jwtSettings.SecretKey) || jwtSettings.SecretKey.Length < 32)
    throw new InvalidOperationException("JwtSettings:SecretKey debe tener al menos 32 caracteres.");

// AuthN (JWT) + RoleClaimType
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),

            // CLAVE para [Authorize(Roles="Admin")]
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = JwtBearerDefaults.AuthenticationScheme
        };
    });

builder.Services.AddAuthorization();

// Swagger con Bearer
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ClinicaProNV.Api", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Pega: Bearer {tu_token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// En Development muestra error real (NO ocultes con middleware)
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseMiddleware<ExceptionHandlingMiddleware>();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
