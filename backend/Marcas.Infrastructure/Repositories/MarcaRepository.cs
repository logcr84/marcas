using Dapper;
using Marcas.Core.DTOs;
using Marcas.Core.Entities;
using Marcas.Core.Interfaces;
using Marcas.Infrastructure.Data;

namespace Marcas.Infrastructure.Repositories;

public class MarcaRepository : IMarcaRepository
{
    private readonly DbConnectionFactory _factory;

    public MarcaRepository(DbConnectionFactory factory) => _factory = factory;

    public async Task<(Marca? existente, bool fueCreada)> CrearObtenerPorIdempotencyAsync(CrearMarcaRequest req)
    {
        using var conn = _factory.CreateConnection();

        // Verificar si ya existe una marca con ese IdempotencyKey
        var existente = await conn.QueryFirstOrDefaultAsync<Marca>(
            "SELECT * FROM asistencia.\"Marca\" WHERE \"IdempotencyKey\" = @IdempotencyKey",
            new { req.IdempotencyKey });

        if (existente is not null)
            return (existente, false);

        // Insertar nueva marca (la hora la pone el servidor con DEFAULT)
        const string sql = """
            INSERT INTO asistencia."Marca"
                ("EmpleadoID", "TipoMarcaID", "AgenteID", "FechaHoraCliente", "IdempotencyKey", "ObservacionTecnica")
            VALUES
                (@EmpleadoID, @TipoMarcaID, @AgenteID, @FechaHoraCliente, @IdempotencyKey, @ObservacionTecnica)
            RETURNING *;
            """;

        var nueva = await conn.QueryFirstAsync<Marca>(sql, new
        {
            req.EmpleadoID,
            req.TipoMarcaID,
            req.AgenteID,
            req.FechaHoraCliente,
            req.IdempotencyKey,
            req.ObservacionTecnica
        });

        return (nueva, true);
    }

    public async Task<List<MarcaResponse>> ObtenerPorEmpleadoFechasAsync(
        long empleadoId, DateOnly fechaInicio, DateOnly fechaFin)
    {
        using var conn = _factory.CreateConnection();
        var result = await conn.QueryAsync<MarcaResponse>(
            "SELECT * FROM asistencia.fn_ReporteMarcasEmpleado(@EmpleadoID, @FechaInicio::DATE, @FechaFin::DATE)",
            new { EmpleadoID = empleadoId, FechaInicio = fechaInicio.ToString("yyyy-MM-dd"), FechaFin = fechaFin.ToString("yyyy-MM-dd") });
        return result.ToList();
    }

    public async Task<List<MarcaResponse>> ReporteGeneralAsync(
        DateOnly fechaInicio, DateOnly fechaFin, int? departamentoId, string? estadoMarca)
    {
        using var conn = _factory.CreateConnection();
        var result = await conn.QueryAsync<MarcaResponse>(
            "SELECT * FROM asistencia.fn_ReporteGeneralMarcas(@FechaInicio::DATE, @FechaFin::DATE, @DepartamentoID, @EstadoMarca)",
            new
            {
                FechaInicio = fechaInicio.ToString("yyyy-MM-dd"),
                FechaFin = fechaFin.ToString("yyyy-MM-dd"),
                DepartamentoID = departamentoId,
                EstadoMarca = estadoMarca
            });
        return result.ToList();
    }
}
