using Marcas.Core.Entities;

namespace Marcas.Core.Interfaces;

public interface IUsuarioRepository
{
    Task<UsuarioWeb?> ObtenerPorLoginAsync(string login);
    Task<UsuarioWeb?> ObtenerPorLoginWindowsAsync(string loginWindows);
    Task ActualizarUltimoAccesoAsync(long usuarioId);
    Task CrearUsuarioAgenteAsync(long empleadoId, string loginWindows);
}
