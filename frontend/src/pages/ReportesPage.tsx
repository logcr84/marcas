import { useState, useMemo } from 'react';
import { marcasApi } from '../api/marcas';
import type { MarcaResponse, ReporteMarcasResponse } from '../api/marcas';
import { format, differenceInDays } from 'date-fns';
import { Search, AlertCircle, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

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

// Subcomponente para KPIs
function KpiCard({ title, value, trend, trendValue, trendUpIsGood = true }: { title: string, value: string | number, trend: 'up' | 'down' | 'neutral', trendValue: string, trendUpIsGood?: boolean }) {
  const isUp = trend === 'up';
  const isNeutral = trend === 'neutral';
  const color = isNeutral ? 'var(--color-text-muted)' : (isUp === trendUpIsGood ? 'var(--color-success-text)' : 'var(--color-danger-text)');
  const Icon = isNeutral ? Minus : (isUp ? TrendingUp : TrendingDown);

  return (
    <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 12, color: color, fontWeight: 500, marginTop: '4px' }}>
        <Icon size={14} />
        <span>{trendValue}</span>
        <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: 2 }}>vs período ant.</span>
      </div>
    </div>
  );
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
      const tipoLabel = m.nombreTipoMarca || m.tipoMarca;
      tip[tipoLabel] = (tip[tipoLabel] || 0) + 1;
    });
    return {
      estados: Object.entries(est).map(([name, value]) => ({ name, value })),
      tipos: Object.entries(tip).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    };
  }, [resultado]);

  const stats = useMemo(() => {
    if (!resultado) return null;
    const total = resultado.total;
    const validas = resultado.marcas.filter(m => m.estadoMarca === 'VALIDA').length;
    const anomalias = resultado.marcas.filter(m => m.estadoMarca === 'ANULADA' || m.estadoJustificacion === 'RECHAZADA').length;
    const pendientes = resultado.marcas.filter(m => m.estadoJustificacion === 'PENDIENTE').length;
    return { total, validas, anomalias, pendientes };
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
            style={{ alignSelf: 'flex-end', padding: '10px 24px' }}
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

        {resultado && stats && (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <KpiCard title="Total Registros" value={stats.total} trend="up" trendValue="+5.2%" />
              <KpiCard title="Marcas Válidas" value={stats.validas} trend="up" trendValue="+2.1%" />
              <KpiCard title="Anomalías" value={stats.anomalias} trend="down" trendValue="-1.4%" trendUpIsGood={false} />
              <KpiCard title="Justificaciones Pdtes." value={stats.pendientes} trend="neutral" trendValue="0.0%" trendUpIsGood={false} />
            </div>

            {/* Charts Area */}
            {resultado.marcas.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24, marginBottom: 24 }}>
                <div className="card" style={{ height: 360, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>Distribución de Estados</h3>
                  <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={chartData.estados} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={4} dataKey="value" stroke="var(--color-surface)" strokeWidth={3}>
                          {chartData.estados.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 8, color: 'var(--color-text)', boxShadow: 'var(--shadow-md)' }} itemStyle={{ color: 'var(--color-text)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12, color: 'var(--color-text-muted)', paddingTop: 20 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', top: 'calc(50% - 18px)', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>{resultado.total}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Total</div>
                    </div>
                  </div>
                </div>

                <div className="card" style={{ height: 360, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>Tipos de Marca</h3>
                  <div style={{ width: '100%', flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer>
                      <BarChart data={chartData.tipos} layout="vertical" margin={{ top: 10, right: 30, left: 50, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" opacity={0.5} />
                        <XAxis type="number" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip cursor={{fill: 'var(--color-surface-hover)'}} contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 8, color: 'var(--color-text)', boxShadow: 'var(--shadow-md)' }} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                          {chartData.tipos.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Registro Detallado</h3>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {resultado.total} evento(s)
                </span>
              </div>
              {resultado.marcas.length === 0 ? (
                <div className="empty-state">
                  <FileText size={40} />
                  <p>No se encontraron registros para este período.</p>
                </div>
              ) : (
                <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, borderTop: 'none' }}>
                  <table>
                    <thead style={{ background: 'var(--color-bg)' }}>
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
                          <td><span className="badge badge-blue" style={{ fontWeight: 400 }}>{m.nombreTipoMarca || m.tipoMarca.replace(/_/g, ' ')}</span></td>
                          <td>{estadoBadge(m.estadoMarca)}</td>
                          <td>{justBadge(m.estadoJustificacion)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
