import { useState } from 'react';
import { marcasApi } from '../api/marcas';
import type { MarcaResponse, ReporteMarcasResponse } from '../api/marcas';
import { format, differenceInDays } from 'date-fns';
import { Search, AlertCircle } from 'lucide-react';

function estadoBadge(estado: string) {
  const map: Record<string, string> = {
    VALIDA: 'badge-green', ANULADA: 'badge-red', PENDIENTE_REVISION: 'badge-yellow',
  };
  return <span className={`badge ${map[estado] ?? 'badge-gray'}`}>{estado}</span>;
}

function justBadge(estado: string | null) {
  if (!estado) return <span className="badge badge-gray">Sin justificación</span>;
  const map: Record<string, string> = {
    PENDIENTE: 'badge-yellow', APROBADA: 'badge-green', RECHAZADA: 'badge-red', ANULADA: 'badge-gray',
  };
  return <span className={`badge ${map[estado] ?? 'badge-gray'}`}>{estado}</span>;
}

export default function ReportesPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [fechaInicio, setFechaInicio] = useState(format(new Date(new Date().setDate(1)), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(today);
  const [resultado, setResultado] = useState<ReporteMarcasResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBuscar = async () => {
    setError('');
    const dias = differenceInDays(new Date(fechaFin), new Date(fechaInicio));
    if (dias > 183) {
      setError('El rango no puede superar 183 días (6 meses). Ajuste las fechas.');
      return;
    }
    setLoading(true);
    try {
      const data = await marcasApi.reporteGeneral(fechaInicio, fechaFin);
      setResultado(data);
    } catch (e: any) {
      setError(e.response?.data?.mensaje ?? 'Error al obtener el reporte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Reporte General de Marcas</h1>
        <p>Consulta de asistencia — Máximo 183 días por consulta (6 meses)</p>
      </div>
      <div className="page-body">
        <div className="filters-bar">
          <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="form-label" htmlFor="reporte-fecha-inicio">Fecha inicio</label>
            <input
              id="reporte-fecha-inicio"
              className="form-input"
              type="date"
              value={fechaInicio}
              max={today}
              onChange={e => setFechaInicio(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="form-label" htmlFor="reporte-fecha-fin">Fecha fin</label>
            <input
              id="reporte-fecha-fin"
              className="form-input"
              type="date"
              value={fechaFin}
              max={today}
              onChange={e => setFechaFin(e.target.value)}
            />
          </div>
          <button
            id="btn-buscar-reporte"
            className="btn btn-primary"
            onClick={handleBuscar}
            disabled={loading}
            style={{ alignSelf: 'flex-end' }}
          >
            {loading ? <span className="spinner" /> : <Search size={16} />}
            Buscar
          </button>
        </div>

        {error && (
          <div className="error-msg" style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {resultado && (
          <div className="card">
            <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                {resultado.total} marca(s) encontradas
              </span>
            </div>
            {resultado.marcas.length === 0 ? (
              <div className="empty-state">
                <Search size={40} />
                <p>No se encontraron marcas en el período seleccionado.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Empleado</th>
                      <th>Fecha / Hora</th>
                      <th>Tipo</th>
                      <th>Estado Marca</th>
                      <th>Justificación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.marcas.map((m: MarcaResponse) => (
                      <tr key={m.marcaID}>
                        <td><code style={{ fontSize: 12 }}>{m.codigoEmpleado}</code></td>
                        <td>{m.nombreEmpleado}</td>
                        <td style={{ color: 'var(--color-text-muted)' }}>
                          {new Date(m.fechaHoraServidor).toLocaleString('es-CR')}
                        </td>
                        <td><span className="badge badge-blue">{m.nombreTipoMarca}</span></td>
                        <td>{estadoBadge(m.estadoMarca)}</td>
                        <td>{justBadge(m.estadoJustificacion)}</td>
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
