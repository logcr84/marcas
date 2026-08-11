using System.Threading;

namespace Marcas.Agent.Worker;

/// <summary>
/// Estado de sesión compartido entre todos los servicios del agente.
/// Se llena automáticamente tras el login con el usuario de Windows.
/// No requiere ninguna configuración manual por empleado.
/// </summary>
public class AgentSession
{
    // ── Identidad del empleado (se llena tras el auto-login) ─────────
    private long _empleadoId;
    private long? _agenteId;
    private string _loginWindows = string.Empty;
    private bool _autenticado;

    public long EmpleadoId    => Volatile.Read(ref _empleadoId);
    public long? AgenteId     => _agenteId;
    public string LoginWindows => _loginWindows;
    public bool Autenticado   => _autenticado;

    /// <summary>
    /// Llamado por SyncService una vez que la API autentica al agente.
    /// </summary>
    public void IniciarSesion(long empleadoId, long? agenteId, string loginWindows)
    {
        Volatile.Write(ref _empleadoId, empleadoId);
        _agenteId     = agenteId;
        _loginWindows = loginWindows;
        _autenticado  = true;
    }

    /// <summary>
    /// Llamado cuando el token expira o hay un error de autenticación.
    /// </summary>
    public void CerrarSesion()
    {
        _autenticado = false;
    }
}
