using System.ComponentModel.DataAnnotations;

namespace Marcas.Core.DTOs;

public record CrearJustificacionRequest(
    [Required] long EmpleadoID,
    long? MarcaID,
    [Required] short MotivoID,
    [Required] DateOnly FechaInicio,
    [Required] DateOnly FechaFin,
    [Required, MaxLength(1000)] string TextoJustificacion
);

public record ResolverJustificacionRequest(
    [Required] string NuevoEstado,  // APROBADA | RECHAZADA | ANULADA
    [MaxLength(1000)] string? ComentarioResolucion
);

/// <summary>
/// DTO de respuesta para justificaciones.
/// Usa clase POCO con setters para compatibilidad con Dapper
/// (los records con DateOnly no son soportados por Dapper al mapear desde SQL Server).
/// </summary>
public class JustificacionResponse
{
    public long JustificacionID { get; set; }
    public string CodigoEmpleado { get; set; } = string.Empty;
    public string NombreEmpleado { get; set; } = string.Empty;
    public string Departamento { get; set; } = string.Empty;
    public string Motivo { get; set; } = string.Empty;
    // SQL Server devuelve DATE como DateTime; convertimos a DateOnly para el cliente
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public string TextoJustificacion { get; set; } = string.Empty;
    public string EstadoJustificacion { get; set; } = string.Empty;
    public DateTime FechaSolicitud { get; set; }
    public DateTime? FechaHoraMarcaAsociada { get; set; }
    public string? TipoMarcaAsociada { get; set; }
}
