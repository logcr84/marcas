namespace Marcas.Core.Entities;

public class UsuarioWeb
{
    public long UsuarioID { get; set; }
    public long? EmpleadoID { get; set; }
    public string Login { get; set; } = string.Empty;
    public string? HashPassword { get; set; }
    public string Estado { get; set; } = "ACTIVO";
    public DateTime? UltimoAcceso { get; set; }
    public List<string> Roles { get; set; } = [];
}
