using System;
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
    private readonly AgentSession _session;
    private readonly string _apiBaseUrl;
    private readonly string _agentSecret;

    private string? _jwtToken;
    private DateTime _tokenExpiracion = DateTime.MinValue;

    public SyncService(
        ILogger<SyncService> logger,
        LocalDb localDb,
        HttpClient httpClient,
        AgentSession session,
        IConfiguration configuration)
    {
        _logger      = logger;
        _localDb     = localDb;
        _httpClient  = httpClient;
        _session     = session;

        var rawUrl = configuration.GetValue<string>("AgentConfig:ApiUrl")
            ?? "http://localhost:5238/api";
        // Normalizar: asegurar que apunte a /api (sin /marcas al final)
        _apiBaseUrl  = rawUrl.TrimEnd('/').EndsWith("/api")
            ? rawUrl.TrimEnd('/')
            : rawUrl.TrimEnd('/') + "/api";

        _agentSecret = configuration.GetValue<string>("AgentConfig:AgentSecret")
            ?? throw new InvalidOperationException("AgentConfig:AgentSecret no configurado.");
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SyncService iniciado. API: {Url}", _apiBaseUrl);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // ── 1. Asegurar token válido ──────────────────────────────
                await AsegurarTokenAsync(stoppingToken);

                if (!_session.Autenticado)
                {
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                    continue;
                }

                // ── 2. Sincronizar marcas pendientes ─────────────────────
                var pendientes = await _localDb.GetUnsyncedMarcasAsync();

                foreach (var marca in pendientes)
                {
                    if (stoppingToken.IsCancellationRequested) break;

                    var payload = new
                    {
                        EmpleadoID         = _session.EmpleadoId,
                        TipoMarcaID        = marca.TipoMarcaID,
                        AgenteID           = _session.AgenteId,
                        IdempotencyKey     = marca.IdempotencyKey,
                        FechaHoraCliente   = marca.FechaHoraCliente,
                        ObservacionTecnica = marca.ObservacionTecnica
                    };

                    var resp = await _httpClient.PostAsJsonAsync(
                        $"{_apiBaseUrl}/marcas", payload, stoppingToken);

                    if (resp.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("✅ Marca {Key} sincronizada.", marca.IdempotencyKey);
                        await _localDb.MarkAsSyncedAsync(marca.IdempotencyKey);
                    }
                    else if (resp.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                    {
                        _logger.LogWarning("Token expirado. Renovando en el siguiente ciclo.");
                        _session.CerrarSesion();
                        _jwtToken        = null;
                        _tokenExpiracion = DateTime.MinValue;
                        break;
                    }
                    else
                    {
                        var body = await resp.Content.ReadAsStringAsync(stoppingToken);
                        _logger.LogWarning("HTTP {Status} al sincronizar {Key}: {Body}",
                            resp.StatusCode, marca.IdempotencyKey, body);
                        break;
                    }
                }
            }
            catch (HttpRequestException ex)
            {
                _logger.LogWarning("Sin conexión (modo offline). {Msg}", ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado en sincronización.");
            }

            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
        }
    }

    // ── Auto-login con usuario de Windows ────────────────────────────
    private async Task AsegurarTokenAsync(CancellationToken ct)
    {
        if (_session.Autenticado && DateTime.UtcNow < _tokenExpiracion.AddMinutes(-10))
            return;

        var loginWindows = Environment.UserName;
        _logger.LogInformation("🔐 Autenticando '{User}' con la API...", loginWindows);

        try
        {
            // Quitar token anterior para no enviar uno expirado
            _httpClient.DefaultRequestHeaders.Authorization = null;

            var payload = new 
            { 
                LoginWindows = loginWindows, 
                AgentSecret = _agentSecret,
                Departamento = Environment.GetEnvironmentVariable("USER_DEPARTAMENTO"),
                Puesto = Environment.GetEnvironmentVariable("USER_PUESTO"),
                NombreCompleto = Environment.GetEnvironmentVariable("USER_NOMBRE_COMPLETO")
            };

            var resp = await _httpClient.PostAsJsonAsync(
                $"{_apiBaseUrl}/auth/login-agente",
                payload,
                ct);

            if (!resp.IsSuccessStatusCode)
            {
                var body = await resp.Content.ReadAsStringAsync(ct);
                _logger.LogError("❌ Login fallido ({Status}): {Body}", resp.StatusCode, body);
                _session.CerrarSesion();
                return;
            }

            var loginResp = await resp.Content.ReadFromJsonAsync<LoginAgenteResponse>(
                cancellationToken: ct);

            if (loginResp?.EmpleadoID is null)
            {
                _logger.LogError("❌ Respuesta de login no contiene EmpleadoID.");
                _session.CerrarSesion();
                return;
            }

            _jwtToken        = loginResp.Token;
            _tokenExpiracion = loginResp.Expiracion;

            // Guardar estado en sesión compartida
            _session.IniciarSesion(loginResp.EmpleadoID.Value, null, loginWindows);

            // Aplicar Bearer a todas las peticiones futuras
            _httpClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _jwtToken);

            _logger.LogInformation(
                "✅ Sesión iniciada: {User} → EmpleadoID={EmpId} (expira {Exp:HH:mm} hora local)",
                loginWindows, loginResp.EmpleadoID, loginResp.Expiracion.ToLocalTime());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción durante el auto-login.");
            _session.CerrarSesion();
        }
    }

    private record LoginAgenteResponse(
        string Token,
        DateTime Expiracion,
        string Login,
        List<string> Roles,
        long? EmpleadoID);
}
