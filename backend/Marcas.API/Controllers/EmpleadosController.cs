using Marcas.Core.DTOs;
using Marcas.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Marcas.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmpleadosController : ControllerBase
{
    private readonly IEmpleadoRepository _empleados;

    public EmpleadosController(IEmpleadoRepository empleados) => _empleados = empleados;

    /// <summary>Lista empleados activos. Soporta búsqueda por nombre o código.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<EmpleadoResponse>), 200)]
    public async Task<IActionResult> Listar([FromQuery] string? busqueda = null)
    {
        var lista = await _empleados.ListarActivosAsync(busqueda);
        return Ok(lista);
    }

    /// <summary>Obtiene datos de un empleado específico por ID.</summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(EmpleadoResponse), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Obtener(long id)
    {
        var empleado = await _empleados.ObtenerPorIdAsync(id);
        if (empleado is null) return NotFound();
        return Ok(empleado);
    }
}
