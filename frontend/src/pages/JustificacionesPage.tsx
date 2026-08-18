import { useEffect, useState, useMemo } from 'react';
import { justificacionesApi } from '../api/marcas';
import type { JustificacionResponse } from '../api/marcas';
import { useAuth } from '../context/AuthContext';
import { Plus, X, CheckCircle, XCircle, FileText, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import DropdownMenu from '../components/DropdownMenu';
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

function estadoBadge(estado: string) {
  const map: Record<string, string> = {
    PENDIENTE: 'badge-yellow', APROBADA: 'badge-green', RECHAZADA: 'badge-red', ANULADA: 'badge-gray',
  };
  return <span className={`badge ${map[estado] ?? 'badge-gray'}`}>{estado}</span>;
}

export default function JustificacionesPage() {
  const { hasRole, user } = useAuth();
  const esAdmin = hasRole('RRHH_ADMIN') || hasRole('JEFATURA');
  const [lista, setLista] = useState<JustificacionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({ empleadoID: user?.empleadoID ?? 0, motivoID: 1, fechaInicio: '', fechaFin: '', textoJustificacion: '' });
  
  const [resolverModal, setResolverModal] = useState<{ id: number; estado: string } | null>(null);
  const [comentario, setComentario] = useState('');
  const [toast, setToast] = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await justificacionesApi.listar(filtroEstado || undefined);
      setLista(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    cargar(); 
    setCurrentPage(1);
  }, [filtroEstado]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await justificacionesApi.crear(form as any);
      setShowModal(false);
      setForm({ ...form, textoJustificacion: '' });
      setShowAdvanced(false);
      showToast('Justificación creada exitosamente.');
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.mensaje ?? 'Error al crear justificación.');
    }
  };

  const handleResolver = async () => {
    if (!resolverModal) return;
    try {
      await justificacionesApi.resolver(resolverModal.id, resolverModal.estado, comentario);
      setResolverModal(null);
      setComentario('');
      showToast(`Justificación ${resolverModal.estado.toLowerCase()} correctamente.`);
      cargar();
    } catch {
      alert('Error al resolver la justificación.');
    }
  };

  const stats = useMemo(() => {
    const pendientes = lista.filter(j => j.estadoJustificacion === 'PENDIENTE').length;
    const aprobadas = lista.filter(j => j.estadoJustificacion === 'APROBADA').length;
    const rechazadas = lista.filter(j => j.estadoJustificacion === 'RECHAZADA').length;
    return { total: lista.length, pendientes, aprobadas, rechazadas };
  }, [lista]);

  return (
    <>
      <div className="page-header">
        <h1>Justificaciones</h1>
        <p>Gestión analítica de solicitudes de justificación de asistencia</p>
      </div>
      <div className="page-body">
        <div className="filters-bar">
          <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
            <label className="form-label" htmlFor="filtro-estado-just">Estado</label>
            <select id="filtro-estado-just" className="form-select" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="APROBADA">Aprobada</option>
              <option value="RECHAZADA">Rechazada</option>
              <option value="ANULADA">Anulada</option>
            </select>
          </div>
          <button
            id="btn-nueva-justificacion"
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            style={{ alignSelf: 'flex-end', padding: '10px 24px' }}
          >
            <Plus size={16} /> Nueva justificación
          </button>
        </div>

        {!loading && lista.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <KpiCard title="Total Solicitudes" value={stats.total} trend="neutral" trendValue="0.0%" />
            <KpiCard title="Pendientes" value={stats.pendientes} trend="down" trendValue="-5.4%" trendUpIsGood={false} />
            <KpiCard title="Aprobadas" value={stats.aprobadas} trend="up" trendValue="+12.1%" />
            <KpiCard title="Rechazadas" value={stats.rechazadas} trend="up" trendValue="+2.1%" trendUpIsGood={false} />
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
        ) : lista.length === 0 ? (
          <div className="empty-state">
            <FileText size={40} />
            <p>No hay justificaciones que mostrar.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>Registro de Solicitudes</h3>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, borderTop: 'none' }}>
              <table>
                <thead style={{ background: 'var(--color-bg)' }}>
                  <tr>
                    <th>#</th>
                    <th>Empleado</th>
                    <th>Departamento</th>
                    <th>Motivo</th>
                    <th style={{ textAlign: 'center' }}>Período</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'center' }}>Solicitado</th>
                    {esAdmin && <th style={{ width: 50, textAlign: 'center' }}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {lista.slice((currentPage - 1) * 10, currentPage * 10).map(j => (
                    <tr key={j.justificacionID}>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>#{j.justificacionID}</td>
                      <td style={{ fontWeight: 500 }}>{j.nombreEmpleado}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>{j.departamento}</td>
                      <td>{j.motivo}</td>
                      <td style={{ fontSize: 12, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        {j.fechaInicio.split('-').reverse().join('/')} - {j.fechaFin.split('-').reverse().join('/')}
                      </td>
                      <td>{estadoBadge(j.estadoJustificacion)}</td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: 12, textAlign: 'center' }}>
                        {new Date(j.fechaSolicitud).toLocaleDateString('es-CR')}
                      </td>
                      {esAdmin && (
                        <td style={{ textAlign: 'center' }}>
                          {j.estadoJustificacion === 'PENDIENTE' && (
                            <DropdownMenu items={[
                              { label: 'Aprobar', icon: <CheckCircle size={14} />, onClick: () => setResolverModal({ id: j.justificacionID, estado: 'APROBADA' }) },
                              { label: 'Rechazar', icon: <XCircle size={14} />, onClick: () => setResolverModal({ id: j.justificacionID, estado: 'RECHAZADA' }), danger: true }
                            ]} />
                          )}
                        </td>
                      )}
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
      </div>

      {/* Modal: Nueva justificación */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Nueva Justificación</div>
              <button className="btn-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form className="modal-form" onSubmit={handleCrear} id="form-nueva-justificacion">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fecha inicio</label>
                  <input className="form-input" type="date" required value={form.fechaInicio}
                    onChange={e => setForm(f => ({ ...f, fechaInicio: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha fin</label>
                  <input className="form-input" type="date" required value={form.fechaFin}
                    onChange={e => setForm(f => ({ ...f, fechaFin: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Motivo</label>
                <select className="form-select" value={form.motivoID}
                  onChange={e => setForm(f => ({ ...f, motivoID: +e.target.value }))}>
                  <option value={1}>Enfermedad o cita médica</option>
                  <option value={2}>Asunto personal autorizado</option>
                  <option value={3}>Capacitación</option>
                  <option value={4}>Viaje por asuntos laborales</option>
                  <option value={5}>Permiso sindical</option>
                  <option value={6}>Falla del sistema</option>
                  <option value={10}>Otro</option>
                </select>
              </div>

              {/* Progressive Disclosure */}
              <div style={{ marginTop: 8, marginBottom: showAdvanced ? 16 : 0 }}>
                <button 
                  type="button" 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--color-accent)', cursor: 'pointer', fontSize: 13, fontWeight: 500, padding: 0 }}
                >
                  {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  Añadir detalles adicionales
                </button>
                
                {showAdvanced && (
                  <div className="form-group" style={{ marginTop: 16 }}>
                    <label className="form-label">Descripción</label>
                    <textarea className="form-textarea" required={showAdvanced} maxLength={1000}
                      placeholder="Explique el motivo detallado de la justificación (máx. 1000 caracteres)"
                      value={form.textoJustificacion}
                      onChange={e => setForm(f => ({ ...f, textoJustificacion: e.target.value }))} />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" id="btn-guardar-justificacion">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resolver justificación */}
      {resolverModal && (
        <div className="modal-overlay" onClick={() => setResolverModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title">
                {resolverModal.estado === 'APROBADA' ? 'Aprobar' : 'Rechazar'} Justificación
              </div>
              <button className="btn-close" onClick={() => setResolverModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-form">
              <div className="form-group">
                <label className="form-label">Comentario (opcional)</label>
                <textarea className="form-textarea" maxLength={1000}
                  placeholder="Añada un comentario técnico a esta resolución..."
                  value={comentario}
                  onChange={e => setComentario(e.target.value)} />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setResolverModal(null)}>Cancelar</button>
                <button
                  className={`btn ${resolverModal.estado === 'APROBADA' ? 'btn-success' : 'btn-danger'}`}
                  id="btn-confirmar-resolucion"
                  onClick={handleResolver}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className="toast toast-success">{toast}</div>
        </div>
      )}
    </>
  );
}

