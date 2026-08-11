using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Marcas.Agent.Worker.Models;
using Marcas.Agent.Worker.Data;

namespace Marcas.Agent.Worker.Services;

/// <summary>
/// Monitorea la inactividad del teclado/mouse y genera marcas automáticas.
/// Lee EmpleadoID de AgentSession (no de appsettings).
/// </summary>
public class ActivityMonitor : BackgroundService
{
    private readonly ILogger<ActivityMonitor> _logger;
    private readonly LocalDb _localDb;
    private readonly AgentSession _session;
    private readonly int _idleThresholdSeconds;

    private bool _isCurrentlyIdle = false;

    public ActivityMonitor(
        ILogger<ActivityMonitor> logger,
        LocalDb localDb,
        AgentSession session,
        IConfiguration configuration)
    {
        _logger               = logger;
        _localDb              = localDb;
        _session              = session;
        _idleThresholdSeconds = configuration.GetValue<int>(
            "AgentConfig:IdleThresholdSeconds", 900); // Default 15 min (Art. 138 CT)
    }

    [DllImport("user32.dll")]
    private static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

    [StructLayout(LayoutKind.Sequential)]
    private struct LASTINPUTINFO
    {
        public uint cbSize;
        public uint dwTime;
    }

    private uint GetIdleSeconds()
    {
        var lastInput = new LASTINPUTINFO { cbSize = (uint)Marshal.SizeOf<LASTINPUTINFO>() };
        return GetLastInputInfo(ref lastInput)
            ? ((uint)Environment.TickCount - lastInput.dwTime) / 1000u
            : 0u;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation(
            "ActivityMonitor iniciado. Umbral de inactividad: {Seg}s ({Min} min).",
            _idleThresholdSeconds, _idleThresholdSeconds / 60);

        // Esperar a que el agente esté autenticado antes de empezar a registrar
        await EsperarSesionAsync(stoppingToken);

        // Marca de Entrada automática al arrancar
        await RecordMarcaAsync(1, "Inicio de sesión de Windows detectado");

        while (!stoppingToken.IsCancellationRequested)
        {
            // Si el token expiró, esperar a que se renueve
            if (!_session.Autenticado)
            {
                await EsperarSesionAsync(stoppingToken);
                continue;
            }

            var idleSecs = GetIdleSeconds();

            if (idleSecs >= _idleThresholdSeconds && !_isCurrentlyIdle)
            {
                _isCurrentlyIdle = true;
                _logger.LogInformation(
                    "Inactividad detectada ({Seg}s). Generando marca de Salida.", idleSecs);
                await RecordMarcaAsync(8, $"Inactividad automática ({idleSecs}s sin actividad)");
            }
            else if (idleSecs < _idleThresholdSeconds && _isCurrentlyIdle)
            {
                _isCurrentlyIdle = false;
                _logger.LogInformation("Actividad detectada. Generando marca de Entrada.");
                await RecordMarcaAsync(1, "Retorno de inactividad detectado");
            }

            await Task.Delay(5_000, stoppingToken);
        }
    }

    private async Task RecordMarcaAsync(byte tipoMarca, string observacion)
    {
        // Si aún no hay sesión, no registrar (evitar EmpleadoID=0)
        if (!_session.Autenticado || _session.EmpleadoId == 0)
        {
            _logger.LogWarning("Sin sesión activa. Marca tipo {T} descartada.", tipoMarca);
            return;
        }

        var marca = new MarcaLocal
        {
            EmpleadoID         = _session.EmpleadoId,
            TipoMarcaID        = tipoMarca,
            AgenteID           = _session.AgenteId,
            IdempotencyKey     = Guid.NewGuid(),
            FechaHoraCliente   = DateTime.Now,
            ObservacionTecnica = observacion,
            IsSynced           = 0,
        };

        await _localDb.SaveMarcaAsync(marca);
    }

    /// <summary>
    /// Espera de forma no bloqueante hasta que AgentSession tenga una sesión válida.
    /// </summary>
    private async Task EsperarSesionAsync(CancellationToken ct)
    {
        _logger.LogInformation("Esperando autenticación del agente...");
        while (!_session.Autenticado && !ct.IsCancellationRequested)
            await Task.Delay(3_000, ct);
    }
}
