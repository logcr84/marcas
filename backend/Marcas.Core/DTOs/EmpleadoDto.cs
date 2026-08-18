namespace Marcas.Core.DTOs;

public record EmpleadoResponse(
    long EmpleadoID,
    string CodigoEmpleado,
    string NombreCompleto,
    string Departamento,
    string Puesto,
    string Email,
    string Estado
);
