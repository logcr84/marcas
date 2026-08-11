using System.ComponentModel.DataAnnotations;

namespace Marcas.Core.DTOs;

public record LoginRequest(
    [Required] string Login,
    [Required] string Password
);

/// <summary>
/// Login del Agente Local usando el usuario de Windows.
/// No requiere contraseña del empleado; usa una clave compartida del servidor.
/// </summary>
public record AgentLoginRequest(
    [Required] string LoginWindows,   // Environment.UserName de la PC
    [Required] string AgentSecret     // Clave compartida configurada en la API
);

public record LoginResponse(
    string Token,
    DateTime Expiracion,
    string Login,
    List<string> Roles,
    long? EmpleadoID
);
