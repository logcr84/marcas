using Marcas.Core.DTOs;

namespace Marcas.Core.Interfaces;

public interface IEmpleadoRepository
{
    Task<List<EmpleadoResponse>> ListarActivosAsync(string? busqueda);
    Task<EmpleadoResponse?> ObtenerPorIdAsync(long empleadoId);
    Task<long> CrearEmpleadoGenericoAsync(string loginWindows, string? departamento = null, string? puesto = null, string? nombreCompleto = null);
}
