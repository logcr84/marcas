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
    private readonly IEmpleadoRepository _empleados;
    private readonly IConfiguration _config;

    public AuthController(IUsuarioRepository usuarios, IEmpleadoRepository empleados, IConfiguration config)
    {
        _usuarios = usuarios;
        _empleados = empleados;
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

    /// <summary>
    /// Login exclusivo del Agente Local. Usa el usuario de Windows de la PC
    /// más una clave compartida del servidor (AgentSecret). No requiere
    /// contraseña individual del empleado.
    /// </summary>
    [HttpPost("login-agente")]
    [ProducesResponseType(typeof(LoginResponse), 200)]
    [ProducesResponseType(401)]
    public async Task<IActionResult> LoginAgente([FromBody] AgentLoginRequest request)
    {
        try
        {
            // 1. Validar la clave compartida del agente
            var agentSecretEsperado = _config["AgentConfig:AgentSecret"];
            if (string.IsNullOrEmpty(agentSecretEsperado) ||
                request.AgentSecret != agentSecretEsperado)
                return Unauthorized(new { mensaje = "Clave de agente inválida." });

            // 2. Desencriptar el login de Windows
            string loginWindowsDecrypted;
            try
            {
                loginWindowsDecrypted = Marcas.API.Helpers.CryptoHelper.DecryptString(request.LoginWindows, agentSecretEsperado);
            }
            catch (Exception ex)
            {
                return Unauthorized(new { mensaje = "Fallo al desencriptar el login." });
            }

            // 3. Buscar el empleado asociado a ese usuario de Windows
            var usuario = await _usuarios.ObtenerPorLoginWindowsAsync(loginWindowsDecrypted);
            
            // 3. AUTO-APROVISIONAMIENTO: Si no existe, crearlo
            if (usuario is null)
            {
                var nuevoEmpleadoId = await _empleados.CrearEmpleadoGenericoAsync(
                    loginWindowsDecrypted,
                    request.Departamento,
                    request.Puesto,
                    request.NombreCompleto);

                // Generar hash de clave genérica inicial (el empleado la cambia en su primer acceso al portal)
                var claveGenerica = $"Marcas{loginWindowsDecrypted}2026!";
                var hashInicial = BCrypt.Net.BCrypt.HashPassword(claveGenerica);

                await _usuarios.CrearUsuarioAgenteAsync(nuevoEmpleadoId, loginWindowsDecrypted, hashInicial);
                
                // Recargar el usuario recién creado
                usuario = await _usuarios.ObtenerPorLoginWindowsAsync(loginWindowsDecrypted);
                
                if (usuario is null)
                    return StatusCode(500, new { mensaje = "Fallo al crear el usuario en el auto-aprovisionamiento." });
            }

            if (usuario.EmpleadoID is null)
                return Unauthorized(new { 
                    mensaje = "El usuario no tiene un empleado asociado." 
                });

            await _usuarios.ActualizarUltimoAccesoAsync(usuario.UsuarioID);

            // 4. Generar JWT de corta duración (solo para el agente, 12 horas)
            var token = GenerarToken(
                usuario.UsuarioID,
                usuario.Login,
                usuario.EmpleadoID,
                ["AGENTE"]);

            var expiracion = DateTime.UtcNow.AddHours(12);

            return Ok(new LoginResponse(
                token, expiracion,
                usuario.LoginWindows ?? usuario.Login,
                ["AGENTE"],
                usuario.EmpleadoID));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { 
                mensaje = "Error interno del servidor", 
                error = ex.Message,
                stackTrace = ex.StackTrace
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
