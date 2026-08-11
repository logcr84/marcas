namespace Marcas.Core.Entities;

public class UsuarioWeb
{
    public long UsuarioID { get; set; }
    public long? EmpleadoID { get; set; }
    public string Login { get; set; } = string.Empty;
    public string? LoginWindows { get; set; }   // Usuario de Windows (ej: "jperez")
    public string? HashPassword { get; set; }
    public string Estado { get; set; } = "ACTIVO";
    public DateTime? UltimoAcceso { get; set; }
    public List<string> Roles { get; set; } = [];
}
