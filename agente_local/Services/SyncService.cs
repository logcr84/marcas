using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Marcas.Agent.Worker.Data;

namespace Marcas.Agent.Worker.Services;

public class SyncService : BackgroundService
{
    private readonly ILogger<SyncService> _logger;
    private readonly LocalDb _localDb;
    private readonly HttpClient _httpClient;
    private readonly string _apiUrl;

    public SyncService(ILogger<SyncService> logger, LocalDb localDb, HttpClient httpClient, IConfiguration configuration)
    {
        _logger = logger;
        _localDb = localDb;
        _httpClient = httpClient;
        _apiUrl = configuration.GetValue<string>("AgentConfig:ApiUrl") ?? "http://localhost:5238/api/marcas";
        
        var authToken = configuration.GetValue<string>("AgentConfig:AuthToken");
        if (!string.IsNullOrEmpty(authToken))
        {
            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authToken);
        }
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SyncService iniciado. Sincronizando con: {ApiUrl}", _apiUrl);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var unsynced = await _localDb.GetUnsyncedMarcasAsync();
                
                foreach (var marca in unsynced)
                {
                    if (stoppingToken.IsCancellationRequested) break;

                    // El backend espera un request como CrearMarcaRequest
                    var payload = new
                    {
                        EmpleadoID = marca.EmpleadoID,
                        TipoMarcaID = marca.TipoMarcaID,
                        AgenteID = marca.AgenteID,
                        IdempotencyKey = marca.IdempotencyKey,
                        FechaHoraCliente = marca.FechaHoraCliente,
                        ObservacionTecnica = marca.ObservacionTecnica
                    };

                    // Hacemos el POST al API
                    var response = await _httpClient.PostAsJsonAsync(_apiUrl, payload, stoppingToken);

                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("Marca {IdempotencyKey} sincronizada con éxito.", marca.IdempotencyKey);
                        await _localDb.MarkAsSyncedAsync(marca.IdempotencyKey);
                    }
                    else
                    {
                        _logger.LogWarning("Error al sincronizar marca {IdempotencyKey}. Status: {StatusCode}", marca.IdempotencyKey, response.StatusCode);
                        // Rompemos el ciclo de marcas para no saturar el servidor, esperamos al siguiente intervalo
                        break; 
                    }
                }
            }
            catch (HttpRequestException ex)
            {
                _logger.LogWarning("API no disponible (Offline mode). Reintentando en breve. Error: {Message}", ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado durante la sincronización.");
            }

            // Intervalo de sincronización
            await Task.Delay(10000, stoppingToken); // 10 segundos
        }
    }
}
