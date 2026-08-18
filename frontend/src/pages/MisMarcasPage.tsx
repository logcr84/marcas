import { useState, useMemo } from 'react';
import { marcasApi } from '../api/marcas';
import type { MarcaResponse } from '../api/marcas';
import { useAuth } from '../context/AuthContext';
import { format, subDays, differenceInDays } from 'date-fns';
import { Search, AlertCircle, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Pagination } from '../components/Pagination';

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

export default function MisMarcasPage() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [fechaInicio, setFechaInicio] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(today);
  const [marcas, setMarcas] = useState<MarcaResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [buscado, setBuscado] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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
      setCurrentPage(1);
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

  const stats = useMemo(() => {
    const total = marcas.length;
    const validas = marcas.filter(m => m.estadoMarca === 'VALIDA').length;
    const anomalias = marcas.filter(m => m.estadoMarca === 'ANULADA').length;
    const entradas = marcas.filter(m => m.tipoMarca.includes('ENTRADA')).length;
    return { total, validas, anomalias, entradas };
  }, [marcas]);

  return (
    <>
      <div className="page-header">
        <h1>Mis Marcas</h1>
        <p>Historial personal analítico de marcas de asistencia</p>
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
            disabled={loading} style={{ alignSelf: 'flex-end', padding: '10px 24px' }}>
            {loading ? <span className="spinner" /> : <Search size={16} />} Buscar
          </button>
        </div>

        {error && <div className="error-msg" style={{ marginBottom: 16 }}><AlertCircle size={16} style={{ display: 'inline', marginRight: 8 }} />{error}</div>}

        {buscado && (
          <>
            {marcas.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <KpiCard title="Total Registros" value={stats.total} trend="up" trendValue="+12.0%" />
                <KpiCard title="Marcas Válidas" value={stats.validas} trend="up" trendValue="+8.5%" />
                <KpiCard title="Total Entradas" value={stats.entradas} trend="neutral" trendValue="0.0%" />
                <KpiCard title="Anomalías" value={stats.anomalias} trend="down" trendValue="-3.2%" trendUpIsGood={false} />
              </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>Registro de Marcas</h3>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  {marcas.length} evento(s)
                </span>
              </div>
              {marcas.length === 0 ? (
                <div className="empty-state">
                  <FileText size={40} />
                  <p>No se encontraron marcas en el período seleccionado.</p>
                </div>
              ) : (
                <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, borderTop: 'none' }}>
                  <table>
                    <thead style={{ background: 'var(--color-bg)' }}>
                      <tr>
                        <th style={{ textAlign: 'center' }}>Fecha y Hora</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th>Observación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marcas.slice((currentPage - 1) * 10, currentPage * 10).map(m => (
                        <tr key={m.marcaID}>
                          <td style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            {format(new Date(m.fechaHoraServidor), 'dd/MM/yyyy HH:mm')}
                          </td>
                          <td><span className={`badge ${tipoColor(m.tipoMarca)}`}>{m.nombreTipoMarca}</span></td>
                          <td>
                            <span className={`badge ${m.estadoMarca === 'VALIDA' ? 'badge-green' : 'badge-red'}`}>
                              {m.estadoMarca}
                            </span>
                          </td>
                          <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                            {m.observacionTecnica ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {marcas.length > 0 && (
                <Pagination 
                  currentPage={currentPage} 
                  totalPages={Math.ceil(marcas.length / 10)} 
                  onPageChange={setCurrentPage} 
                />
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
