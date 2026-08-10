using Marcas.Core.DTOs;
using Marcas.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Marcas.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUsuarioRepository _usuarios;
    private readonly IConfiguration _config;

    public AuthController(IUsuarioRepository usuarios, IConfiguration config)
    {
        _usuarios = usuarios;
        _config = config;
    }

    /// <summary>Autenticación de usuario del portal. Retorna un JWT.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try 
        {
            var usuario = await _usuarios.ObtenerPorLoginAsync(request.Login);
            if (usuario is null || usuario.HashPassword is null)
                return Unauthorized(new { mensaje = "Credenciales inválidas." });

            if (!BCrypt.Net.BCrypt.Verify(request.Password, usuario.HashPassword))
                return Unauthorized(new { mensaje = "Credenciales inválidas." });

            await _usuarios.ActualizarUltimoAccesoAsync(usuario.UsuarioID);

            var token = GenerarToken(usuario.UsuarioID, usuario.Login, usuario.EmpleadoID, usuario.Roles);
            var expiracion = DateTime.UtcNow.AddHours(
                _config.GetValue<int>("JwtSettings:ExpirationHours", 8));

            return Ok(new LoginResponse(token, expiracion, usuario.Login, usuario.Roles, usuario.EmpleadoID));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { 
                mensaje = "Error interno del servidor", 
                error = ex.Message, 
                stackTrace = ex.StackTrace,
                innerException = ex.InnerException?.Message 
            });
        }
    }

    private string GenerarToken(long usuarioId, string login, long? empleadoId, List<string> roles)
    {
        var jwtSection = _config.GetSection("JwtSettings");
        var secretKey = jwtSection["SecretKey"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuarioId.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, login),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        if (empleadoId.HasValue)
            claims.Add(new Claim("empleadoId", empleadoId.Value.ToString()));
        foreach (var rol in roles)
            claims.Add(new Claim(ClaimTypes.Role, rol));

        var token = new JwtSecurityToken(
            issuer: jwtSection["Issuer"],
            audience: jwtSection["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(_config.GetValue<int>("JwtSettings:ExpirationHours", 8)),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
