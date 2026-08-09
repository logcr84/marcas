using Marcas.Core.Entities;

namespace Marcas.Core.Interfaces;

public interface IUsuarioRepository
{
    Task<UsuarioWeb?> ObtenerPorLoginAsync(string login);
    Task ActualizarUltimoAccesoAsync(long usuarioId);
}
