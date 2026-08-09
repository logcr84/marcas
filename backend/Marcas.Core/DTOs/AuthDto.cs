using System.ComponentModel.DataAnnotations;

namespace Marcas.Core.DTOs;

public record LoginRequest(
    [Required] string Login,
    [Required] string Password
);

public record LoginResponse(
    string Token,
    DateTime Expiracion,
    string Login,
    List<string> Roles,
    long? EmpleadoID
);
