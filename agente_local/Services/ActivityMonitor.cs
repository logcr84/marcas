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

public class ActivityMonitor : BackgroundService
{
    private readonly ILogger<ActivityMonitor> _logger;
    private readonly LocalDb _localDb;
    private readonly IConfiguration _configuration;
    private readonly int _idleThresholdSeconds;
    private readonly long _empleadoId;

    private bool _isCurrentlyIdle = false;

    public ActivityMonitor(ILogger<ActivityMonitor> logger, LocalDb localDb, IConfiguration configuration)
    {
        _logger = logger;
        _localDb = localDb;
        _configuration = configuration;
        _idleThresholdSeconds = _configuration.GetValue<int>("AgentConfig:IdleThresholdSeconds", 300); // Default 5 mins
        _empleadoId = _configuration.GetValue<long>("AgentConfig:EmpleadoID", 1);
    }

    [DllImport("user32.dll")]
    private static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

    [StructLayout(LayoutKind.Sequential)]
    private struct LASTINPUTINFO
    {
        public uint cbSize;
        public uint dwTime;
    }

    private uint GetIdleTime()
    {
        var lastInputInfo = new LASTINPUTINFO();
        lastInputInfo.cbSize = (uint)Marshal.SizeOf(lastInputInfo);
        
        if (GetLastInputInfo(ref lastInputInfo))
        {
            var systemUptime = (uint)Environment.TickCount;
            var idleTicks = systemUptime - lastInputInfo.dwTime;
            return idleTicks / 1000; // Returns idle time in seconds
        }
        return 0;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ActivityMonitor iniciado. Umbral de inactividad: {Seconds}s", _idleThresholdSeconds);

        // Generamos una marca de "Entrada" al iniciar el servicio (o reanudar la PC)
        await RecordMarcaAsync(1); // 1 = Entrada

        while (!stoppingToken.IsCancellationRequested)
        {
            var idleTime = GetIdleTime();

            if (idleTime >= _idleThresholdSeconds && !_isCurrentlyIdle)
            {
                // El usuario pasó a estado inactivo (Salida)
                _isCurrentlyIdle = true;
                _logger.LogInformation("Usuario inactivo detectado ({IdleTime}s). Generando marca de Salida.", idleTime);
                await RecordMarcaAsync(2); // 2 = Salida
            }
            else if (idleTime < _idleThresholdSeconds && _isCurrentlyIdle)
            {
                // El usuario volvió a estar activo (Entrada)
                _isCurrentlyIdle = false;
                _logger.LogInformation("Usuario volvió a estar activo. Generando marca de Entrada.");
                await RecordMarcaAsync(1); // 1 = Entrada
            }

            await Task.Delay(5000, stoppingToken); // Check every 5 seconds
        }
    }

    private async Task RecordMarcaAsync(byte tipoMarca)
    {
        var marca = new MarcaLocal
        {
            EmpleadoID = _empleadoId,
            TipoMarcaID = tipoMarca,
            AgenteID = null, // Podría ser el ID de este agente/PC
            IdempotencyKey = Guid.NewGuid(),
            FechaHoraCliente = DateTime.Now,
            ObservacionTecnica = tipoMarca == 1 ? "Retorno a la actividad" : "Inactividad detectada",
            IsSynced = 0
        };

        await _localDb.SaveMarcaAsync(marca);
    }
}
