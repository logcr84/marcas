namespace Marcas.Core.Entities;

public class Justificacion
{
    public long JustificacionID { get; set; }
    public long EmpleadoID { get; set; }
    public long? MarcaID { get; set; }
    public short MotivoID { get; set; }
    public DateOnly FechaInicio { get; set; }
    public DateOnly FechaFin { get; set; }
    public string TextoJustificacion { get; set; } = string.Empty;
    public string EstadoJustificacion { get; set; } = "PENDIENTE";
    public DateTime FechaSolicitud { get; set; }
    public long? AprobadorEmpleadoID { get; set; }
    public DateTime? FechaResolucion { get; set; }
    public string? ComentarioResolucion { get; set; }
}
