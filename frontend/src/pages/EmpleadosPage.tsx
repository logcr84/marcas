import { useEffect, useState, useMemo } from 'react';
import { empleadosApi } from '../api/marcas';
import { Pagination } from '../components/Pagination';
import type { EmpleadoResponse } from '../api/marcas';
import { Search, Users, TrendingUp, TrendingDown, Minus, Eye, X } from 'lucide-react';

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

function estadoBadge(estado: string) {
  return (
    <span className={`badge ${estado === 'ACTIVO' ? 'badge-green' : 'badge-gray'}`}>
      {estado}
    </span>
  );
}

export default function EmpleadosPage() {
  const [lista, setLista] = useState<EmpleadoResponse[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<EmpleadoResponse | null>(null);

  const cargar = async (b?: string) => {
    setLoading(true);
    try {
      const data = await empleadosApi.listar(b || undefined);
      setLista(data);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    cargar(busqueda);
  };

  const stats = useMemo(() => {
    const activos = lista.filter(e => e.estado === 'ACTIVO').length;
    const inactivos = lista.filter(e => e.estado !== 'ACTIVO').length;
    return { total: lista.length, activos, inactivos };
  }, [lista]);

  return (
    <>
      <div className="page-header">
        <h1>Directorio de Empleados</h1>
        <p>Gestión y análisis de personal en el sistema</p>
      </div>
      <div className="page-body">
        <form className="filters-bar" onSubmit={handleSearch} id="form-buscar-empleados">
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label" htmlFor="input-busqueda-empleado">Búsqueda Rápida</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--color-text-muted)' }} />
              <input
                id="input-busqueda-empleado"
                className="form-input"
                type="text"
                placeholder="Nombre, código o identificación..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>
          <button type="submit" id="btn-buscar-empleado" className="btn btn-primary" style={{ alignSelf: 'flex-end', padding: '10px 24px' }}>
            Buscar
          </button>
        </form>

        {!loading && lista.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <KpiCard title="Total Plantilla" value={stats.total} trend="neutral" trendValue="0.0%" />
            <KpiCard title="Activos" value={stats.activos} trend="up" trendValue="+1.2%" />
            <KpiCard title="Inactivos" value={stats.inactivos} trend="neutral" trendValue="0.0%" trendUpIsGood={false} />
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : lista.length === 0 ? (
          <div className="empty-state">
            <Users size={40} />
            <p>No se encontraron empleados con los criterios especificados.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Nómina de Empleados</h3>
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                {lista.length} registro(s)
              </span>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, borderTop: 'none' }}>
              <table>
                <thead style={{ background: 'var(--color-bg)' }}>
                  <tr>
                    <th>Código</th>
                    <th>Nombre completo</th>
                    <th>Departamento</th>
                    <th>Puesto</th>
                    <th style={{ width: 100 }}>Estado</th>
                    <th style={{ width: 80, textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.slice((currentPage - 1) * 10, currentPage * 10).map(e => (
                    <tr key={e.empleadoID}>
                      <td><code style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{e.codigoEmpleado}</code></td>
                      <td style={{ fontWeight: 500 }}>{e.nombreCompleto}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{e.departamento}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{e.puesto}</td>
                      <td>{estadoBadge(e.estado)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-dropdown-trigger"
                          onClick={() => setEmpleadoSeleccionado(e)}
                          title="Ver detalle"
                          style={{ margin: '0 auto' }}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination 
              currentPage={currentPage} 
              totalPages={Math.ceil(lista.length / 10)} 
              onPageChange={setCurrentPage} 
            />
          </div>
        )}

        {empleadoSeleccionado && (
          <div className="modal-overlay" onClick={() => setEmpleadoSeleccionado(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Detalle del Empleado</h3>
                <button className="btn-close" onClick={() => setEmpleadoSeleccionado(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Código</label>
                    <div className="form-input" style={{ background: 'transparent', borderColor: 'transparent', padding: '8px 0' }}>{empleadoSeleccionado.codigoEmpleado}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <div style={{ padding: '8px 0' }}>{estadoBadge(empleadoSeleccionado.estado)}</div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Nombre Completo</label>
                  <div className="form-input" style={{ background: 'transparent', borderColor: 'transparent', padding: '8px 0', fontWeight: 500 }}>{empleadoSeleccionado.nombreCompleto}</div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Departamento</label>
                    <div className="form-input" style={{ background: 'transparent', borderColor: 'transparent', padding: '8px 0' }}>{empleadoSeleccionado.departamento}</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Puesto</label>
                    <div className="form-input" style={{ background: 'transparent', borderColor: 'transparent', padding: '8px 0' }}>{empleadoSeleccionado.puesto}</div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <div className="form-input" style={{ background: 'transparent', borderColor: 'transparent', padding: '8px 0' }}>{empleadoSeleccionado.email || 'No registrado'}</div>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setEmpleadoSeleccionado(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
