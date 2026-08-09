using Marcas.Core.DTOs;
using Marcas.Core.Entities;

namespace Marcas.Core.Interfaces;

public interface IMarcaRepository
{
    Task<(Marca? existente, bool fueCreada)> CrearObtenerPorIdempotencyAsync(CrearMarcaRequest request);
    Task<List<MarcaResponse>> ObtenerPorEmpleadoFechasAsync(long empleadoId, DateOnly fechaInicio, DateOnly fechaFin);
    Task<List<MarcaResponse>> ReporteGeneralAsync(DateOnly fechaInicio, DateOnly fechaFin, int? departamentoId, string? estadoMarca);
}
