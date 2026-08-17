import { useState, useMemo } from 'react';
import { marcasApi } from '../api/marcas';
import type { MarcaResponse, ReporteMarcasResponse } from '../api/marcas';
import { format, differenceInDays } from 'date-fns';
import { Search, AlertCircle, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

function estadoBadge(estado: string) {
  const map: Record<string, string> = {
    VALIDA: 'badge-green', ANULADA: 'badge-red', PENDIENTE_REVISION: 'badge-yellow',
  };
  return <span className={`badge ${map[estado] ?? 'badge-gray'}`}>{estado}</span>;
}

function justBadge(estado: string | null) {
  if (!estado) return <span className="badge badge-gray" style={{ opacity: 0.5 }}>-</span>;
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

  const chartData = useMemo(() => {
    if (!resultado || !resultado.marcas) return { estados: [], tipos: [] };
    const est: Record<string, number> = {};
    const tip: Record<string, number> = {};
    resultado.marcas.forEach(m => {
      est[m.estadoMarca] = (est[m.estadoMarca] || 0) + 1;
      tip[m.nombreTipoMarca] = (tip[m.nombreTipoMarca] || 0) + 1;
    });
    return {
      estados: Object.entries(est).map(([name, value]) => ({ name, value })),
      tipos: Object.entries(tip).map(([name, value]) => ({ name, value }))
    };
  }, [resultado]);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <>
      <div className="page-header">
        <h1>Reporte Analítico de Marcas</h1>
        <p>Consulta de asistencia y análisis visual del período (máx. 183 días)</p>
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
            Analizar
          </button>
        </div>

        {error && (
          <div className="error-msg" style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {resultado && (
          <>
            {resultado.marcas.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>
                <div className="card" style={{ height: 320 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, textAlign: 'center' }}>Distribución por Estado</h3>
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie data={chartData.estados} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {chartData.estados.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 8 }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="card" style={{ height: 320 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, textAlign: 'center' }}>Distribución por Tipo</h3>
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie data={chartData.tipos} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {chartData.tipos.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 8 }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="card">
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Registro detallado</h3>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {resultado.total} marca(s)
                </span>
              </div>
              {resultado.marcas.length === 0 ? (
                <div className="empty-state">
                  <FileText size={40} />
                  <p>No se encontraron registros para este período.</p>
                </div>
              ) : (
                <div className="card" style={{ padding: 0 }}>
                  <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Empleado</th>
                          <th style={{ textAlign: 'center' }}>Fecha y Hora</th>
                          <th>Tipo</th>
                          <th>Estado</th>
                          <th>Justificación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultado.marcas.map((m: MarcaResponse) => (
                          <tr key={m.marcaID}>
                            <td><code style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{m.codigoEmpleado}</code></td>
                            <td style={{ fontWeight: 500 }}>{m.nombreEmpleado}</td>
                            <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                              {format(new Date(m.fechaHoraServidor), 'dd/MM/yyyy HH:mm')}
                            </td>
                            <td><span className="badge badge-blue" style={{ fontWeight: 400 }}>{m.nombreTipoMarca}</span></td>
                            <td>{estadoBadge(m.estadoMarca)}</td>
                            <td>{justBadge(m.estadoJustificacion)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
