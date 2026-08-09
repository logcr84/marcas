import { useState } from 'react';
import { marcasApi } from '../api/marcas';
import type { MarcaResponse } from '../api/marcas';
import { useAuth } from '../context/AuthContext';
import { format, subDays, differenceInDays } from 'date-fns';
import { Search, AlertCircle } from 'lucide-react';

export default function MisMarcasPage() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [fechaInicio, setFechaInicio] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(today);
  const [marcas, setMarcas] = useState<MarcaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [buscado, setBuscado] = useState(false);

  const handleBuscar = async () => {
    setError('');
    if (!user?.empleadoID) { setError('No hay un empleado asociado a esta cuenta.'); return; }
    const dias = differenceInDays(new Date(fechaFin), new Date(fechaInicio));
    if (dias > 183) { setError('El rango no puede superar 183 días.'); return; }
    setLoading(true);
    try {
      const data = await marcasApi.porEmpleado(user.empleadoID, fechaInicio, fechaFin);
      setMarcas(data);
      setBuscado(true);
    } catch (e: any) {
      setError(e.response?.data?.mensaje ?? 'Error al obtener marcas.');
    } finally {
      setLoading(false);
    }
  };

  function tipoColor(tipo: string): string {
    if (tipo.includes('ENTRADA')) return 'badge-green';
    if (tipo.includes('SALIDA')) return 'badge-blue';
    return 'badge-gray';
  }

  return (
    <>
      <div className="page-header">
        <h1>Mis Marcas</h1>
        <p>Historial personal de marcas de asistencia</p>
      </div>
      <div className="page-body">
        <div className="filters-bar">
          <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="form-label" htmlFor="mis-marcas-inicio">Desde</label>
            <input id="mis-marcas-inicio" className="form-input" type="date" value={fechaInicio} max={today}
              onChange={e => setFechaInicio(e.target.value)} />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="form-label" htmlFor="mis-marcas-fin">Hasta</label>
            <input id="mis-marcas-fin" className="form-input" type="date" value={fechaFin} max={today}
              onChange={e => setFechaFin(e.target.value)} />
          </div>
          <button id="btn-buscar-mis-marcas" className="btn btn-primary" onClick={handleBuscar}
            disabled={loading} style={{ alignSelf: 'flex-end' }}>
            {loading ? <span className="spinner" /> : <Search size={16} />} Buscar
          </button>
        </div>

        {error && <div className="error-msg" style={{ marginBottom: 16 }}><AlertCircle size={16} style={{ display: 'inline', marginRight: 8 }} />{error}</div>}

        {buscado && (
          <div className="card">
            <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--color-text-muted)' }}>
              {marcas.length} marca(s) en el período
            </div>
            {marcas.length === 0 ? (
              <div className="empty-state"><p>No se encontraron marcas en el período seleccionado.</p></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha y Hora</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th>Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marcas.map(m => (
                      <tr key={m.marcaID}>
                        <td>{new Date(m.fechaHoraServidor).toLocaleString('es-CR')}</td>
                        <td><span className={`badge ${tipoColor(m.tipoMarca)}`}>{m.nombreTipoMarca}</span></td>
                        <td>
                          <span className={`badge ${m.estadoMarca === 'VALIDA' ? 'badge-green' : 'badge-red'}`}>
                            {m.estadoMarca}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
                          {m.observacionTecnica ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
