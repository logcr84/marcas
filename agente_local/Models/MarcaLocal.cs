using System;

namespace Marcas.Agent.Worker.Models;

public class MarcaLocal
{
    public long EmpleadoID { get; set; }
    public byte TipoMarcaID { get; set; }
    public long? AgenteID { get; set; }
    public Guid IdempotencyKey { get; set; }
    public DateTime FechaHoraCliente { get; set; }
    public string? ObservacionTecnica { get; set; }
    public int IsSynced { get; set; } // 0 = false, 1 = true
}
