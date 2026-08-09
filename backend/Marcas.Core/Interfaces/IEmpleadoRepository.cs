using Marcas.Core.DTOs;

namespace Marcas.Core.Interfaces;

public interface IEmpleadoRepository
{
    Task<List<EmpleadoResponse>> ListarActivosAsync(string? busqueda);
    Task<EmpleadoResponse?> ObtenerPorIdAsync(long empleadoId);
}
