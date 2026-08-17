using Dapper;
using Marcas.Core.DTOs;
using Marcas.Core.Interfaces;
using Marcas.Infrastructure.Data;

namespace Marcas.Infrastructure.Repositories;

public class EmpleadoRepository : IEmpleadoRepository
{
    private readonly DbConnectionFactory _factory;

    public EmpleadoRepository(DbConnectionFactory factory) => _factory = factory;

    public async Task<List<EmpleadoResponse>> ListarActivosAsync(string? busqueda)
    {
        using var conn = _factory.CreateConnection();
        const string sql = """
            SELECT e."EmpleadoID", e."CodigoEmpleado",
                   e."Nombre" || ' ' || e."PrimerApellido" || COALESCE(' ' || e."SegundoApellido", '') AS "NombreCompleto",
                   d."Nombre" AS "Departamento",
                   p."Nombre" AS "Puesto",
                   e."Estado"
            FROM rrhh."Empleado" e
            JOIN rrhh."Departamento" d ON d."DepartamentoID" = e."DepartamentoID"
            JOIN rrhh."Puesto" p ON p."PuestoID" = e."PuestoID"
            WHERE e."Estado" = 'ACTIVO'
              AND (@Busqueda IS NULL
                   OR e."CodigoEmpleado" ILIKE '%' || @Busqueda || '%'
                   OR e."Nombre" ILIKE '%' || @Busqueda || '%'
                   OR e."PrimerApellido" ILIKE '%' || @Busqueda || '%')
            ORDER BY e."PrimerApellido", e."Nombre";
            """;
        var result = await conn.QueryAsync<EmpleadoResponse>(sql, new { Busqueda = busqueda });
        return result.ToList();
    }

    public async Task<EmpleadoResponse?> ObtenerPorIdAsync(long empleadoId)
    {
        using var conn = _factory.CreateConnection();
        const string sql = """
            SELECT e."EmpleadoID", e."CodigoEmpleado",
                   e."Nombre" || ' ' || e."PrimerApellido" || COALESCE(' ' || e."SegundoApellido", '') AS "NombreCompleto",
                   d."Nombre" AS "Departamento",
                   p."Nombre" AS "Puesto",
                   e."Estado"
            FROM rrhh."Empleado" e
            JOIN rrhh."Departamento" d ON d."DepartamentoID" = e."DepartamentoID"
            JOIN rrhh."Puesto" p ON p."PuestoID" = e."PuestoID"
            WHERE e."EmpleadoID" = @EmpleadoID;
            """;
        return await conn.QueryFirstOrDefaultAsync<EmpleadoResponse>(sql, new { EmpleadoID = empleadoId });
    }

    public async Task<long> CrearEmpleadoGenericoAsync(string loginWindows, string? departamento = null, string? puesto = null, string? nombreCompleto = null)
    {
        using var conn = _factory.CreateConnection();
        
        var nombreDepto = string.IsNullOrWhiteSpace(departamento) ? "Sin Asignar" : departamento;
        var nombrePuesto = string.IsNullOrWhiteSpace(puesto) ? "Sin Asignar" : puesto;

        // 1. Asegurar Departamento
        const string sqlDepto = """
            INSERT INTO rrhh."Departamento" ("Nombre", "Estado") 
            VALUES (@Nombre, 'ACTIVO') 
            ON CONFLICT ("Nombre") DO UPDATE SET "Estado" = 'ACTIVO'
            RETURNING "DepartamentoID";
            """;
        var deptoId = await conn.ExecuteScalarAsync<int>(sqlDepto, new { Nombre = nombreDepto });

        // 2. Asegurar Puesto
        const string sqlPuesto = """
            INSERT INTO rrhh."Puesto" ("Nombre", "Estado") 
            VALUES (@Nombre, 'ACTIVO') 
            ON CONFLICT ("Nombre") DO UPDATE SET "Estado" = 'ACTIVO'
            RETURNING "PuestoID";
            """;
        var puestoId = await conn.ExecuteScalarAsync<int>(sqlPuesto, new { Nombre = nombrePuesto });

        // 3. Crear el empleado temporal
        var codigo = $"AUTO-{loginWindows.ToUpper()}";
        var identificacion = Guid.NewGuid().ToString()[..15]; // temporal
        
        // Split de Nombre Completo si viene
        var nombreFinal = loginWindows;
        var apellidoFinal = "Generado";
        if (!string.IsNullOrWhiteSpace(nombreCompleto))
        {
            var partes = nombreCompleto.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            nombreFinal = partes[0];
            if (partes.Length > 1) apellidoFinal = partes[1];
        }

        const string sqlEmpleado = """
            INSERT INTO rrhh."Empleado" (
                "CodigoEmpleado", "Identificacion", "Nombre", "PrimerApellido", 
                "DepartamentoID", "PuestoID", "FechaIngreso", "Estado"
            ) VALUES (
                @Codigo, @Identificacion, @Nombre, @Apellido, 
                @Depto, @Puesto, CURRENT_DATE, 'ACTIVO'
            ) RETURNING "EmpleadoID";
            """;

        return await conn.ExecuteScalarAsync<long>(sqlEmpleado, new {
            Codigo = codigo,
            Identificacion = identificacion,
            Nombre = nombreFinal,
            Apellido = apellidoFinal,
            Depto = deptoId,
            Puesto = puestoId
        });
    }
}
