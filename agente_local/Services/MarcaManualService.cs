using System;
using System.Threading.Tasks;
using Marcas.Agent.Worker.Data;
using Marcas.Agent.Worker.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Marcas.Agent.Worker.Services;

/// <summary>
/// Servicio para registrar marcas manualmente desde la interfaz de la bandeja.
/// Guarda directamente en SQLite local; el SyncService las enviará a la API.
/// </summary>
public class MarcaManualService
{
    private readonly LocalDb _localDb;
    private readonly ILogger<MarcaManualService> _logger;
    private readonly long _empleadoId;
    private readonly long? _agenteId;

    public MarcaManualService(
        LocalDb localDb,
        ILogger<MarcaManualService> logger,
        IConfiguration configuration)
    {
        _localDb   = localDb;
        _logger    = logger;
        _empleadoId = configuration.GetValue<long>("AgentConfig:EmpleadoID");
        _agenteId   = configuration.GetValue<long?>("AgentConfig:AgenteID");
    }

    /// <summary>
    /// Registra una marca de forma manual con el tipo indicado.
    /// </summary>
    /// <param name="tipoMarcaId">
    ///   1=Entrada | 2=Salida Almuerzo | 3=Regreso Almuerzo |
    ///   4=Salida  | 5=Pausa          | 6=Salida Reunión   | 7=Regreso Reunión
    /// </param>
    /// <param name="observacion">Texto breve que indica que fue manual.</param>
    public async Task RegistrarMarcaManualAsync(byte tipoMarcaId, string? observacion = null)
    {
        var marca = new MarcaLocal
        {
            IdempotencyKey    = Guid.NewGuid(),
            EmpleadoID        = _empleadoId,
            TipoMarcaID       = tipoMarcaId,
            AgenteID          = _agenteId,
            FechaHoraCliente  = DateTime.Now,
            ObservacionTecnica = observacion ?? "Marca manual",
            IsSynced          = 0,
        };

        await _localDb.SaveMarcaAsync(marca);

        _logger.LogInformation(
            "Marca manual tipo {TipoMarcaID} registrada para empleado {EmpleadoID} a las {Hora}.",
            tipoMarcaId, _empleadoId, marca.FechaHoraCliente.ToString("HH:mm:ss"));
    }
}
