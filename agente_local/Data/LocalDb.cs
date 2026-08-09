using Dapper;
using Marcas.Agent.Worker.Models;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace Marcas.Agent.Worker.Data;

public class LocalDb
{
    private readonly string _dbPath;
    private readonly string _connectionString;
    private readonly ILogger<LocalDb> _logger;

    public LocalDb(ILogger<LocalDb> logger)
    {
        _logger = logger;
        _dbPath = Path.Combine(System.Environment.GetFolderPath(System.Environment.SpecialFolder.LocalApplicationData), "MarcasAgent", "local.db");
        _connectionString = $"Data Source={_dbPath}";
        InitializeDatabase();
    }

    private void InitializeDatabase()
    {
        var directory = Path.GetDirectoryName(_dbPath);
        if (!Directory.Exists(directory) && directory != null)
        {
            Directory.CreateDirectory(directory);
        }

        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        const string sql = @"
            CREATE TABLE IF NOT EXISTS Marcas (
                IdempotencyKey TEXT PRIMARY KEY,
                EmpleadoID INTEGER NOT NULL,
                TipoMarcaID INTEGER NOT NULL,
                AgenteID INTEGER,
                FechaHoraCliente TEXT NOT NULL,
                ObservacionTecnica TEXT,
                IsSynced INTEGER NOT NULL DEFAULT 0
            );";
        
        connection.Execute(sql);
        _logger.LogInformation("Base de datos local SQLite inicializada en: {Path}", _dbPath);
    }

    public async Task SaveMarcaAsync(MarcaLocal marca)
    {
        using var connection = new SqliteConnection(_connectionString);
        const string sql = @"
            INSERT INTO Marcas (IdempotencyKey, EmpleadoID, TipoMarcaID, AgenteID, FechaHoraCliente, ObservacionTecnica, IsSynced)
            VALUES (@IdempotencyKey, @EmpleadoID, @TipoMarcaID, @AgenteID, @FechaHoraCliente, @ObservacionTecnica, 0)
            ON CONFLICT(IdempotencyKey) DO NOTHING;";
        
        await connection.ExecuteAsync(sql, new {
            IdempotencyKey = marca.IdempotencyKey.ToString(),
            marca.EmpleadoID,
            marca.TipoMarcaID,
            marca.AgenteID,
            FechaHoraCliente = marca.FechaHoraCliente.ToString("O"),
            marca.ObservacionTecnica
        });
        _logger.LogInformation("Marca {IdempotencyKey} guardada localmente.", marca.IdempotencyKey);
    }

    public async Task<IEnumerable<MarcaLocal>> GetUnsyncedMarcasAsync()
    {
        using var connection = new SqliteConnection(_connectionString);
        const string sql = "SELECT * FROM Marcas WHERE IsSynced = 0;";
        return await connection.QueryAsync<MarcaLocal>(sql);
    }

    public async Task MarkAsSyncedAsync(System.Guid idempotencyKey)
    {
        using var connection = new SqliteConnection(_connectionString);
        const string sql = "UPDATE Marcas SET IsSynced = 1 WHERE IdempotencyKey = @IdempotencyKey;";
        await connection.ExecuteAsync(sql, new { IdempotencyKey = idempotencyKey.ToString() });
        _logger.LogInformation("Marca {IdempotencyKey} marcada como sincronizada.", idempotencyKey);
    }
}
