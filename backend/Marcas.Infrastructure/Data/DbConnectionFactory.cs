using Microsoft.Extensions.Configuration;
using Npgsql;
using System.Data;

namespace Marcas.Infrastructure.Data;

public class DbConnectionFactory
{
    private readonly string _connectionString;

    public DbConnectionFactory(IConfiguration configuration)
    {
        var rawConnStr = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("La cadena de conexión 'DefaultConnection' no está configurada.");

        // Render.com inyecta la conexión en formato URI (postgres://user:pass@host:port/db)
        if (rawConnStr.StartsWith("postgres://") || rawConnStr.StartsWith("postgresql://"))
        {
            var uri = new Uri(rawConnStr);
            var userInfo = uri.UserInfo.Split(':');
            _connectionString = $"Host={uri.Host};Port={(uri.Port > 0 ? uri.Port : 5432)};Database={uri.LocalPath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Prefer;Trust Server Certificate=true;";
        }
        else
        {
            _connectionString = rawConnStr;
        }
    }

    public IDbConnection CreateConnection()
    {
        return new NpgsqlConnection(_connectionString);
    }
}
