using System;
using System.Threading.Tasks;
using Marcas.Agent.Worker.Data;
using Marcas.Agent.Worker.Models;
using Microsoft.Extensions.Logging;

namespace Marcas.Agent.Worker.Services;

/// <summary>
/// Registra marcas manuales desde la bandeja del sistema.
/// Lee el EmpleadoID directamente de AgentSession (obtenido tras el auto-login).
/// No requiere configuración manual.
/// </summary>
public class MarcaManualService
{
    private readonly LocalDb _localDb;
    private readonly AgentSession _session;
    private readonly ILogger<MarcaManualService> _logger;

    public MarcaManualService(
        LocalDb localDb,
        AgentSession session,
        ILogger<MarcaManualService> logger)
    {
        _localDb = localDb;
        _session = session;
        _logger  = logger;
    }

    /// <summary>
    /// Registra una marca manual. Si el agente aún no está autenticado,
    /// la marca se guarda con EmpleadoID=0 y se corrige cuando se sincronice.
    /// </summary>
    public async Task RegistrarMarcaManualAsync(byte tipoMarcaId, string? observacion = null)
    {
        if (!_session.Autenticado)
            throw new InvalidOperationException(
                "El agente aún no se ha conectado al servidor.\n" +
                "Espera unos segundos mientras establece la conexión.");

        var marca = new MarcaLocal
        {
            IdempotencyKey     = Guid.NewGuid(),
            EmpleadoID         = _session.EmpleadoId,
            TipoMarcaID        = tipoMarcaId,
            AgenteID           = _session.AgenteId,
            FechaHoraCliente   = DateTime.Now,
            ObservacionTecnica = observacion ?? "Marca manual",
            IsSynced           = 0,
        };

        await _localDb.SaveMarcaAsync(marca);

        _logger.LogInformation(
            "Marca manual tipo {Tipo} registrada para EmpleadoID={Id} a las {Hora}.",
            tipoMarcaId, marca.EmpleadoID, marca.FechaHoraCliente.ToString("HH:mm:ss"));
    }
}
