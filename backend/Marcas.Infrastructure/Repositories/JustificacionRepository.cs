using Dapper;
using Marcas.Core.DTOs;
using Marcas.Core.Interfaces;
using Marcas.Infrastructure.Data;

namespace Marcas.Infrastructure.Repositories;

public class JustificacionRepository : IJustificacionRepository
{
    private readonly DbConnectionFactory _factory;

    public JustificacionRepository(DbConnectionFactory factory) => _factory = factory;

    public async Task<long> CrearAsync(CrearJustificacionRequest req, long solicitanteEmpleadoId)
    {
        using var conn = _factory.CreateConnection();
        const string sql = """
            INSERT INTO asistencia."Justificacion"
                ("EmpleadoID", "MarcaID", "MotivoID", "FechaInicio", "FechaFin", "TextoJustificacion")
            VALUES
                (@EmpleadoID, @MarcaID, @MotivoID, @FechaInicio::DATE, @FechaFin::DATE, @TextoJustificacion)
            RETURNING "JustificacionID";
            """;
        return await conn.ExecuteScalarAsync<long>(sql, new
        {
            req.EmpleadoID,
            req.MarcaID,
            req.MotivoID,
            FechaInicio = req.FechaInicio.ToString("yyyy-MM-dd"),
            FechaFin = req.FechaFin.ToString("yyyy-MM-dd"),
            req.TextoJustificacion
        });
    }

    public async Task<List<JustificacionResponse>> ListarAsync(string? estado, long? empleadoId)
    {
        using var conn = _factory.CreateConnection();
        const string sql = """
            SELECT j."JustificacionID", j."EmpleadoID", e."CodigoEmpleado",
                   e."Nombre" || ' ' || e."PrimerApellido" AS "NombreEmpleado",
                   d."Nombre" AS "Departamento",
                   mj."Descripcion" AS "Motivo",
                   j."FechaInicio", j."FechaFin", j."TextoJustificacion",
                   j."EstadoJustificacion", j."FechaSolicitud",
                   m."FechaHoraServidor" AS "FechaHoraMarcaAsociada",
                   tm."Nombre" AS "TipoMarcaAsociada"
            FROM asistencia."Justificacion" j
            JOIN rrhh."Empleado" e ON e."EmpleadoID" = j."EmpleadoID"
            JOIN rrhh."Departamento" d ON d."DepartamentoID" = e."DepartamentoID"
            JOIN asistencia."MotivoJustificacion" mj ON mj."MotivoID" = j."MotivoID"
            LEFT JOIN asistencia."Marca" m ON m."MarcaID" = j."MarcaID"
            LEFT JOIN asistencia."TipoMarca" tm ON tm."TipoMarcaID" = m."TipoMarcaID"
            WHERE (@Estado IS NULL OR j."EstadoJustificacion" = @Estado)
              AND (@EmpleadoID IS NULL OR j."EmpleadoID" = @EmpleadoID)
            ORDER BY j."FechaSolicitud" DESC;
            """;
        var result = await conn.QueryAsync<JustificacionResponse>(sql, new { Estado = estado, EmpleadoID = empleadoId });
        return result.ToList();
    }

    public async Task<JustificacionResponse?> ObtenerPorIdAsync(long justificacionId)
    {
        using var conn = _factory.CreateConnection();
        const string sql = """
            SELECT j."JustificacionID", j."EmpleadoID", e."CodigoEmpleado",
                   e."Nombre" || ' ' || e."PrimerApellido" AS "NombreEmpleado",
                   d."Nombre" AS "Departamento",
                   mj."Descripcion" AS "Motivo",
                   j."FechaInicio", j."FechaFin", j."TextoJustificacion",
                   j."EstadoJustificacion", j."FechaSolicitud",
                   m."FechaHoraServidor" AS "FechaHoraMarcaAsociada",
                   tm."Nombre" AS "TipoMarcaAsociada"
            FROM asistencia."Justificacion" j
            JOIN rrhh."Empleado" e ON e."EmpleadoID" = j."EmpleadoID"
            JOIN rrhh."Departamento" d ON d."DepartamentoID" = e."DepartamentoID"
            JOIN asistencia."MotivoJustificacion" mj ON mj."MotivoID" = j."MotivoID"
            LEFT JOIN asistencia."Marca" m ON m."MarcaID" = j."MarcaID"
            LEFT JOIN asistencia."TipoMarca" tm ON tm."TipoMarcaID" = m."TipoMarcaID"
            WHERE j."JustificacionID" = @JustificacionID;
            """;
        return await conn.QueryFirstOrDefaultAsync<JustificacionResponse>(sql, new { JustificacionID = justificacionId });
    }

    public async Task<bool> ResolverAsync(long justificacionId, ResolverJustificacionRequest req, long aprobadorEmpleadoId)
    {
        var estadosValidos = new[] { "APROBADA", "RECHAZADA", "ANULADA" };
        if (!estadosValidos.Contains(req.NuevoEstado))
            throw new ArgumentException("Estado no válido.");

        using var conn = _factory.CreateConnection();
        const string sql = """
            UPDATE asistencia."Justificacion"
            SET "EstadoJustificacion" = @NuevoEstado,
                "AprobadorEmpleadoID" = @AprobadorEmpleadoID,
                "FechaResolucion" = CURRENT_TIMESTAMP,
                "ComentarioResolucion" = @ComentarioResolucion
            WHERE "JustificacionID" = @JustificacionID
              AND "EstadoJustificacion" = 'PENDIENTE';
            """;
        var rows = await conn.ExecuteAsync(sql, new
        {
            req.NuevoEstado,
            AprobadorEmpleadoID = aprobadorEmpleadoId,
            req.ComentarioResolucion,
            JustificacionID = justificacionId
        });
        return rows > 0;
    }
}
