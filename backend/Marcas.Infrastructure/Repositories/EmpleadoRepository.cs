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
            SELECT e.EmpleadoID, e.CodigoEmpleado,
                   e.Nombre + ' ' + e.PrimerApellido + ISNULL(' ' + e.SegundoApellido, '') AS NombreCompleto,
                   d.Nombre AS Departamento,
                   p.Nombre AS Puesto,
                   e.Estado
            FROM rrhh.Empleado e
            JOIN rrhh.Departamento d ON d.DepartamentoID = e.DepartamentoID
            JOIN rrhh.Puesto p ON p.PuestoID = e.PuestoID
            WHERE e.Estado = 'ACTIVO'
              AND (@Busqueda IS NULL
                   OR e.CodigoEmpleado LIKE '%' + @Busqueda + '%'
                   OR e.Nombre LIKE '%' + @Busqueda + '%'
                   OR e.PrimerApellido LIKE '%' + @Busqueda + '%')
            ORDER BY e.PrimerApellido, e.Nombre;
            """;
        var result = await conn.QueryAsync<EmpleadoResponse>(sql, new { Busqueda = busqueda });
        return result.ToList();
    }

    public async Task<EmpleadoResponse?> ObtenerPorIdAsync(long empleadoId)
    {
        using var conn = _factory.CreateConnection();
        const string sql = """
            SELECT e.EmpleadoID, e.CodigoEmpleado,
                   e.Nombre + ' ' + e.PrimerApellido + ISNULL(' ' + e.SegundoApellido, '') AS NombreCompleto,
                   d.Nombre AS Departamento,
                   p.Nombre AS Puesto,
                   e.Estado
            FROM rrhh.Empleado e
            JOIN rrhh.Departamento d ON d.DepartamentoID = e.DepartamentoID
            JOIN rrhh.Puesto p ON p.PuestoID = e.PuestoID
            WHERE e.EmpleadoID = @EmpleadoID;
            """;
        return await conn.QueryFirstOrDefaultAsync<EmpleadoResponse>(sql, new { EmpleadoID = empleadoId });
    }
}
