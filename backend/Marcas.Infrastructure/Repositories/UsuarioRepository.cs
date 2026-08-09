using Dapper;
using Marcas.Core.Entities;
using Marcas.Core.Interfaces;
using Marcas.Infrastructure.Data;

namespace Marcas.Infrastructure.Repositories;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly DbConnectionFactory _factory;

    public UsuarioRepository(DbConnectionFactory factory) => _factory = factory;

    public async Task<UsuarioWeb?> ObtenerPorLoginAsync(string login)
    {
        using var conn = _factory.CreateConnection();
        const string sql = """
            SELECT u.UsuarioID, u.EmpleadoID, u.Login, u.HashPassword, u.Estado, u.UltimoAcceso
            FROM seguridad.UsuarioWeb u
            WHERE u.Login = @Login AND u.Estado = 'ACTIVO';
            """;
        var usuario = await conn.QueryFirstOrDefaultAsync<UsuarioWeb>(sql, new { Login = login });
        if (usuario is null) return null;

        const string sqlRoles = """
            SELECT r.Nombre
            FROM seguridad.UsuarioRol ur
            JOIN seguridad.Rol r ON r.RolID = ur.RolID
            WHERE ur.UsuarioID = @UsuarioID;
            """;
        var roles = await conn.QueryAsync<string>(sqlRoles, new { usuario.UsuarioID });
        usuario.Roles = roles.ToList();
        return usuario;
    }

    public async Task ActualizarUltimoAccesoAsync(long usuarioId)
    {
        using var conn = _factory.CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE seguridad.UsuarioWeb SET UltimoAcceso = SYSUTCDATETIME() WHERE UsuarioID = @UsuarioID",
            new { UsuarioID = usuarioId });
    }
}
