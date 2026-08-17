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
            SELECT u."UsuarioID", u."EmpleadoID", u."Login", u."LoginWindows", u."HashPassword", u."Estado", u."UltimoAcceso"
            FROM seguridad."UsuarioWeb" u
            WHERE u."Login" = @Login AND u."Estado" = 'ACTIVO';
            """;
        var usuario = await conn.QueryFirstOrDefaultAsync<UsuarioWeb>(sql, new { Login = login });
        if (usuario is null) return null;

        usuario.Roles = await CargarRolesAsync(conn, usuario.UsuarioID);
        return usuario;
    }

    /// <summary>
    /// Busca un usuario activo por su nombre de usuario de Windows (Environment.UserName).
    /// Usado exclusivamente por el Agente Local para auto-autenticarse.
    /// </summary>
    public async Task<UsuarioWeb?> ObtenerPorLoginWindowsAsync(string loginWindows)
    {
        using var conn = _factory.CreateConnection();
        const string sql = """
            SELECT u."UsuarioID", u."EmpleadoID", u."Login", u."LoginWindows", u."HashPassword", u."Estado", u."UltimoAcceso"
            FROM seguridad."UsuarioWeb" u
            WHERE u."LoginWindows" = @LoginWindows AND u."Estado" = 'ACTIVO';
            """;
        var usuario = await conn.QueryFirstOrDefaultAsync<UsuarioWeb>(sql, new { LoginWindows = loginWindows });
        if (usuario is null) return null;

        usuario.Roles = await CargarRolesAsync(conn, usuario.UsuarioID);
        return usuario;
    }

    public async Task ActualizarUltimoAccesoAsync(long usuarioId)
    {
        using var conn = _factory.CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE seguridad.\"UsuarioWeb\" SET \"UltimoAcceso\" = CURRENT_TIMESTAMP WHERE \"UsuarioID\" = @UsuarioID",
            new { UsuarioID = usuarioId });
    }

    // ── Método privado compartido ────────────────────────────────
    private static async Task<List<string>> CargarRolesAsync(System.Data.IDbConnection conn, long usuarioId)
    {
        const string sql = """
            SELECT r."Nombre"
            FROM seguridad."UsuarioRol" ur
            JOIN seguridad."Rol" r ON r."RolID" = ur."RolID"
            WHERE ur."UsuarioID" = @UsuarioID;
            """;
        var roles = await conn.QueryAsync<string>(sql, new { UsuarioID = usuarioId });
        return roles.ToList();
    }

    public async Task CrearUsuarioAgenteAsync(long empleadoId, string loginWindows)
    {
        using var conn = _factory.CreateConnection();
        const string sql = """
            INSERT INTO seguridad."UsuarioWeb" ("EmpleadoID", "Login", "LoginWindows", "Estado")
            VALUES (@EmpleadoID, @LoginWindows, @LoginWindows, 'ACTIVO');
            """;
        await conn.ExecuteAsync(sql, new { EmpleadoID = empleadoId, LoginWindows = loginWindows });
    }
}

