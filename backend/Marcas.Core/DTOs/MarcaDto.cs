using System.ComponentModel.DataAnnotations;

namespace Marcas.Core.DTOs;

// Request del agente para crear una nueva marca
public record CrearMarcaRequest(
    [Required] long EmpleadoID,
    [Required] byte TipoMarcaID,
    long? AgenteID,
    [Required] Guid IdempotencyKey,
    DateTime? FechaHoraCliente,
    string? ObservacionTecnica
);

/// <summary>
/// Respuesta de una marca — clase POCO para compatibilidad con Dapper
/// (nullable y tipos compuestos en records pueden fallar al mapear).
/// </summary>
public class MarcaResponse
{
    public long MarcaID { get; set; }
    public long EmpleadoID { get; set; }
    public string CodigoEmpleado { get; set; } = string.Empty;
    public string NombreEmpleado { get; set; } = string.Empty;
    public DateTime FechaHoraServidor { get; set; }
    public DateTime? FechaHoraCliente { get; set; }
    public string TipoMarca { get; set; } = string.Empty;
    public string NombreTipoMarca { get; set; } = string.Empty;
    public string EstadoMarca { get; set; } = string.Empty;
    public string? ObservacionTecnica { get; set; }
    public long? JustificacionID { get; set; }
    public string? EstadoJustificacion { get; set; }
    public string? TextoJustificacion { get; set; }
    public string? MotivoJustificacion { get; set; }
}

// Respuesta de reporte
public class ReporteMarcasResponse
{
    public List<MarcaResponse> Marcas { get; set; } = [];
    public int Total { get; set; }
    public string FechaInicio { get; set; } = string.Empty;
    public string FechaFin { get; set; } = string.Empty;
}
