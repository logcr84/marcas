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
    private readonly string _apiBaseUrl;
    private readonly string _agentSecret;

    // Token JWT obtenido dinámicamente al iniciar
    private string? _jwtToken;
    private DateTime _tokenExpiracion = DateTime.MinValue;

    public SyncService(
        ILogger<SyncService> logger,
        LocalDb localDb,
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _logger     = logger;
        _localDb    = localDb;
        _httpClient = httpClient;

        // URL base de la API (sin /marcas al final, lo agregamos en cada llamada)
        var apiUrl = configuration.GetValue<string>("AgentConfig:ApiUrl")
            ?? "http://localhost:5238/api";
        // Normalizar: remover /marcas si ya lo traía el appsettings viejo
        _apiBaseUrl = apiUrl.TrimEnd('/').Replace("/marcas", "");

        _agentSecret = configuration.GetValue<string>("AgentConfig:AgentSecret")
            ?? throw new InvalidOperationException("AgentConfig:AgentSecret no está configurado.");
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SyncService iniciado. API: {ApiBaseUrl}", _apiBaseUrl);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // 1. Asegurar que tenemos un token válido
                await AsegurarTokenAsync(stoppingToken);

                if (_jwtToken is null)
                {
                    _logger.LogWarning("Sin token JWT. Reintentando en 30 segundos...");
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                    continue;
                }

                // 2. Sincronizar marcas pendientes
                var unsynced = await _localDb.GetUnsyncedMarcasAsync();

                foreach (var marca in unsynced)
                {
                    if (stoppingToken.IsCancellationRequested) break;

                    var payload = new
                    {
                        EmpleadoID         = marca.EmpleadoID,
                        TipoMarcaID        = marca.TipoMarcaID,
                        AgenteID           = marca.AgenteID,
                        IdempotencyKey     = marca.IdempotencyKey,
                        FechaHoraCliente   = marca.FechaHoraCliente,
                        ObservacionTecnica = marca.ObservacionTecnica
                    };

                    var response = await _httpClient.PostAsJsonAsync(
                        $"{_apiBaseUrl}/marcas", payload, stoppingToken);

                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("Marca {Key} sincronizada.", marca.IdempotencyKey);
                        await _localDb.MarkAsSyncedAsync(marca.IdempotencyKey);
                    }
                    else if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                    {
                        // Token expirado: forzar re-login en el siguiente ciclo
                        _logger.LogWarning("Token expirado. Renovando...");
                        _jwtToken        = null;
                        _tokenExpiracion = DateTime.MinValue;
                        break;
                    }
                    else
                    {
                        _logger.LogWarning("Error al sincronizar {Key}. HTTP {Status}",
                            marca.IdempotencyKey, response.StatusCode);
                        break;
                    }
                }
            }
            catch (HttpRequestException ex)
            {
                _logger.LogWarning("API no disponible (modo offline). Reintentando. Error: {Msg}", ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado durante la sincronización.");
            }

            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
        }
    }

    // ── Auto-login con usuario de Windows ────────────────────────────
    private async Task AsegurarTokenAsync(CancellationToken ct)
    {
        // Si el token es válido y no expira en los próximos 10 minutos, reutilizarlo
        if (_jwtToken is not null && DateTime.UtcNow < _tokenExpiracion.AddMinutes(-10))
            return;

        var loginWindows = Environment.UserName;   // Ej: "jperez"
        _logger.LogInformation("Autenticando agente con usuario de Windows: {User}", loginWindows);

        try
        {
            var payload = new
            {
                LoginWindows = loginWindows,
                AgentSecret  = _agentSecret
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"{_apiBaseUrl}/auth/login-agente", payload, ct);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(ct);
                _logger.LogError("Login de agente fallido. HTTP {Status}: {Body}",
                    response.StatusCode, body);
                _jwtToken = null;
                return;
            }

            var loginResp = await response.Content.ReadFromJsonAsync<LoginAgenteResponse>(
                cancellationToken: ct);

            if (loginResp is null)
            {
                _logger.LogError("Respuesta de login vacía.");
                return;
            }

            _jwtToken        = loginResp.Token;
            _tokenExpiracion = loginResp.Expiracion;

            // Aplicar el token a todas las peticiones futuras del HttpClient
            _httpClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _jwtToken);

            _logger.LogInformation(
                "Token obtenido para '{User}' (EmpleadoID={EmpId}). Expira: {Exp:HH:mm}",
                loginWindows, loginResp.EmpleadoID, loginResp.Expiracion.ToLocalTime());

            // Sincronizar EmpleadoID dinámico con la base de datos local
            if (loginResp.EmpleadoID.HasValue)
                await _localDb.ActualizarEmpleadoIdAsync(loginResp.EmpleadoID.Value);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción al intentar login de agente.");
            _jwtToken = null;
        }
    }

    // ── DTO local para deserializar la respuesta de login ────────────
    private record LoginAgenteResponse(
        string Token,
        DateTime Expiracion,
        string Login,
        List<string> Roles,
        long? EmpleadoID);
}
