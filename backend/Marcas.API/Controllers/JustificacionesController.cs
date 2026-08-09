using Marcas.Core.DTOs;
using Marcas.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Marcas.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class JustificacionesController : ControllerBase
{
    private readonly IJustificacionRepository _justificaciones;

    public JustificacionesController(IJustificacionRepository justificaciones)
        => _justificaciones = justificaciones;

    /// <summary>Lista justificaciones. Filtrable por estado y empleado.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<JustificacionResponse>), 200)]
    public async Task<IActionResult> Listar(
        [FromQuery] string? estado = null,
        [FromQuery] long? empleadoId = null)
    {
        var lista = await _justificaciones.ListarAsync(estado, empleadoId);
        return Ok(lista);
    }

    /// <summary>Obtiene una justificación específica por ID.</summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(JustificacionResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Obtener(long id)
    {
        var just = await _justificaciones.ObtenerPorIdAsync(id);
        if (just is null) return NotFound();
        return Ok(just);
    }

    /// <summary>Crea una nueva justificación (estado inicial: PENDIENTE).</summary>
    [HttpPost]
    [ProducesResponseType(201)]
    public async Task<IActionResult> Crear([FromBody] CrearJustificacionRequest request)
    {
        if (request.FechaFin < request.FechaInicio)
            return BadRequest(new { mensaje = "La fecha de fin no puede ser anterior a la fecha de inicio." });

        var empleadoIdClaim = User.FindFirstValue("empleadoId");
        long solicitante = long.TryParse(empleadoIdClaim, out var eid) ? eid : 0;

        var id = await _justificaciones.CrearAsync(request, solicitante);
        return StatusCode(201, new { JustificacionID = id });
    }

    /// <summary>Aprueba, rechaza o anula una justificación pendiente.</summary>
    [HttpPut("{id:long}/estado")]
    [Authorize(Roles = "RRHH_ADMIN,JEFATURA")]
    [ProducesResponseType(200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Resolver(long id, [FromBody] ResolverJustificacionRequest request)
    {
        var empleadoIdClaim = User.FindFirstValue("empleadoId");
        long aprobador = long.TryParse(empleadoIdClaim, out var eid) ? eid : 0;

        try
        {
            var ok = await _justificaciones.ResolverAsync(id, request, aprobador);
            if (!ok) return NotFound(new { mensaje = "Justificación no encontrada o no está en estado PENDIENTE." });
            return Ok(new { mensaje = $"Justificación {request.NuevoEstado} correctamente." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}
