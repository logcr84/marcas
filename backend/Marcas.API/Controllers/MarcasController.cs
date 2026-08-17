using Marcas.Core.DTOs;
using Marcas.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Marcas.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MarcasController : ControllerBase
{
    private readonly IMarcaRepository _marcas;

    public MarcasController(IMarcaRepository marcas) => _marcas = marcas;

    /// <summary>
    /// Registra una nueva marca de asistencia. Si el IdempotencyKey ya existe, retorna la marca existente (HTTP 200).
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(object), 200)]
    [ProducesResponseType(typeof(object), 201)]
    public async Task<IActionResult> Crear([FromBody] CrearMarcaRequest request)
    {
        var (marca, fueCreada) = await _marcas.CrearObtenerPorIdempotencyAsync(request);
        if (!fueCreada)
            return Ok(new { mensaje = "Marca ya existente (idempotente).", marca });

        return StatusCode(201, new { mensaje = "Marca registrada exitosamente.", marca });
    }

    /// <summary>
    /// Obtiene las marcas de un empleado en un rango de fechas (máximo 183 días).
    /// </summary>
    [HttpGet("empleado/{empleadoId:long}")]
    [Authorize(Roles = "RRHH_ADMIN,JEFATURA,AUDITOR,EMPLEADO_CONSULTA")]
    [ProducesResponseType(typeof(List<MarcaResponse>), 200)]
    [ProducesResponseType(403)]
    public async Task<IActionResult> ObtenerPorEmpleado(
        long empleadoId,
        [FromQuery] DateOnly fechaInicio,
        [FromQuery] DateOnly fechaFin)
    {
        bool isAdmin = User.IsInRole("RRHH_ADMIN") || User.IsInRole("JEFATURA") || User.IsInRole("AUDITOR");
        if (!isAdmin)
        {
            var empleadoIdClaim = User.FindFirstValue("empleadoId");
            long miEmpleadoId = long.TryParse(empleadoIdClaim, out var eid) ? eid : 0;
            if (empleadoId != miEmpleadoId) return Forbid();
        }

        if ((fechaFin.DayNumber - fechaInicio.DayNumber) > 183)
            return BadRequest(new { mensaje = "El rango de fechas no puede superar 183 días (6 meses)." });

        var marcas = await _marcas.ObtenerPorEmpleadoFechasAsync(empleadoId, fechaInicio, fechaFin);
        return Ok(marcas);
    }
}
