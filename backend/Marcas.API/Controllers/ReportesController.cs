using Marcas.Core.DTOs;
using Marcas.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Marcas.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "RRHH_ADMIN,JEFATURA,AUDITOR")]
public class ReportesController : ControllerBase
{
    private readonly IMarcaRepository _marcas;

    public ReportesController(IMarcaRepository marcas) => _marcas = marcas;

    /// <summary>
    /// Reporte general de marcas. Solo accesible para RRHH_ADMIN, JEFATURA y AUDITOR.
    /// Rango máximo: 183 días.
    /// </summary>
    [HttpGet("marcas")]
    [ProducesResponseType(typeof(ReporteMarcasResponse), 200)]
    public async Task<IActionResult> ReporteGeneral(
        [FromQuery] DateOnly fechaInicio,
        [FromQuery] DateOnly fechaFin,
        [FromQuery] int? departamentoId = null,
        [FromQuery] string? estadoMarca = null)
    {
        if ((fechaFin.DayNumber - fechaInicio.DayNumber) > 183)
            return BadRequest(new { mensaje = "El rango de fechas no puede superar 183 días (6 meses)." });

        var marcas = await _marcas.ReporteGeneralAsync(fechaInicio, fechaFin, departamentoId, estadoMarca);
        return Ok(new ReporteMarcasResponse
        {
            Marcas = marcas,
            Total = marcas.Count,
            FechaInicio = fechaInicio.ToString("yyyy-MM-dd"),
            FechaFin = fechaFin.ToString("yyyy-MM-dd")
        });
    }
}
