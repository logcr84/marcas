using Marcas.Core.Interfaces;
using Marcas.Infrastructure.Data;
using Marcas.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ── Render.com: escuchar en el puerto que inyecta la plataforma ──────────
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// ── Servicios de infraestructura ──────────────────────────────
builder.Services.AddSingleton<DbConnectionFactory>();

builder.Services.AddScoped<IMarcaRepository, MarcaRepository>();
builder.Services.AddScoped<IJustificacionRepository, JustificacionRepository>();
builder.Services.AddScoped<IEmpleadoRepository, EmpleadoRepository>();
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();

// ── JWT Authentication ────────────────────────────────────────
var jwtSection = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSection["SecretKey"] ?? throw new InvalidOperationException("JwtSettings:SecretKey no configurado.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// ── CORS ──────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("PortalPolicy", policy =>
    {
        if (allowedOrigins.Contains("*"))
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
    });
});

// ── Controllers + OpenAPI (nativo .NET 10) ────────────────────
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// ── Pipeline ──────────────────────────────────────────────────
// OpenAPI/Scalar disponible en todos los entornos para facilitar la validación post-deploy
app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options.Title = "Marcas API";
    options.WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient);
});

// NOTA: UseHttpsRedirection eliminado — Render maneja TLS en el edge (reverse proxy)
app.UseCors("PortalPolicy");
app.UseAuthentication();
app.UseAuthorization();

// ── Habilitar archivos estáticos para React ───────────────────
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();

// ── Endpoint para despertar la API (Render Free Tier) ─────────
app.MapGet("/api/health", () => Results.Ok(new { status = "ok", message = "API is awake" }));

// ── Redirigir cualquier ruta no encontrada al index de React ──
app.MapFallbackToFile("index.html");

app.Run();
