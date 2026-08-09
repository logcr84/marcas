using Marcas.Core.DTOs;

namespace Marcas.Core.Interfaces;

public interface IJustificacionRepository
{
    Task<long> CrearAsync(CrearJustificacionRequest request, long solicitanteEmpleadoId);
    Task<List<JustificacionResponse>> ListarAsync(string? estado, long? empleadoId);
    Task<JustificacionResponse?> ObtenerPorIdAsync(long justificacionId);
    Task<bool> ResolverAsync(long justificacionId, ResolverJustificacionRequest request, long aprobadorEmpleadoId);
}
