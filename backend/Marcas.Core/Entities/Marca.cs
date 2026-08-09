namespace Marcas.Core.Entities;

public class Marca
{
    public long MarcaID { get; set; }
    public long EmpleadoID { get; set; }
    public byte TipoMarcaID { get; set; }
    public long? AgenteID { get; set; }
    public DateTime FechaHoraServidor { get; set; }
    public DateTime? FechaHoraCliente { get; set; }
    public Guid IdempotencyKey { get; set; }
    public string EstadoMarca { get; set; } = "VALIDA";
    public string? ObservacionTecnica { get; set; }
}
