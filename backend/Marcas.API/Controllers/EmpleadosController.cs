using Marcas.Core.DTOs;
using Marcas.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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
    [Authorize(Roles = "RRHH_ADMIN,JEFATURA,AUDITOR")]
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
    [ProducesResponseType(403)]
    public async Task<IActionResult> Obtener(long id)
    {
        bool isAdmin = User.IsInRole("RRHH_ADMIN") || User.IsInRole("JEFATURA") || User.IsInRole("AUDITOR");
        if (!isAdmin)
        {
            var empleadoIdClaim = User.FindFirstValue("empleadoId");
            long miEmpleadoId = long.TryParse(empleadoIdClaim, out var eid) ? eid : 0;
            if (id != miEmpleadoId) return Forbid();
        }

        var empleado = await _empleados.ObtenerPorIdAsync(id);
        if (empleado is null) return NotFound();
        return Ok(empleado);
    }

    public class UpdatePerfilRequest
    {
        public string CodigoEmpleado { get; set; } = string.Empty;
        public string NombreCompleto { get; set; } = string.Empty;
        public string Departamento { get; set; } = string.Empty;
        public string Puesto { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    /// <summary>Actualiza el perfil del empleado logueado.</summary>
    [HttpPut("perfil")]
    [ProducesResponseType(204)]
    public async Task<IActionResult> ActualizarPerfil([FromBody] UpdatePerfilRequest req)
    {
        var empleadoIdClaim = User.FindFirstValue("empleadoId");
        if (!long.TryParse(empleadoIdClaim, out var empleadoId) || empleadoId <= 0)
            return Forbid();

        await _empleados.ActualizarPerfilAsync(empleadoId, req.CodigoEmpleado, req.NombreCompleto, req.Departamento, req.Puesto, req.Email);
        return NoContent();
    }
}
