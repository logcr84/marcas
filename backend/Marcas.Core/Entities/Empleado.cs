namespace Marcas.Core.Entities;

public class Empleado
{
    public long EmpleadoID { get; set; }
    public string CodigoEmpleado { get; set; } = string.Empty;
    public string Identificacion { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string PrimerApellido { get; set; } = string.Empty;
    public string? SegundoApellido { get; set; }
    public int DepartamentoID { get; set; }
    public int PuestoID { get; set; }
    public DateOnly FechaIngreso { get; set; }
    public string Estado { get; set; } = "ACTIVO";
    public string? NombreCompleto => $"{Nombre} {PrimerApellido} {SegundoApellido}".Trim();
}
