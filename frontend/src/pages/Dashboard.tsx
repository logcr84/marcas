import { useEffect, useState } from 'react';
import { Fingerprint, ClipboardCheck, Clock, Users } from 'lucide-react';
import { marcasApi, justificacionesApi, empleadosApi } from '../api/marcas';
import { format, subDays } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState({ marcasHoy: 0, pendientes: 0, empleados: 0, marcasSemana: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hoy = format(new Date(), 'yyyy-MM-dd');
    const semanaAtras = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    Promise.all([
      marcasApi.reporteGeneral(hoy, hoy).catch(() => ({ total: 0 })),
      justificacionesApi.listar('PENDIENTE').catch(() => []),
      empleadosApi.listar().catch(() => []),
      marcasApi.reporteGeneral(semanaAtras, hoy).catch(() => ({ total: 0 })),
    ]).then(([hoyData, pendientes, empleados, semana]) => {
      setStats({
        marcasHoy: (hoyData as any).total ?? 0,
        pendientes: (pendientes as any[]).length,
        empleados: (empleados as any[]).length,
        marcasSemana: (semana as any).total ?? 0,
      });
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Marcas hoy', value: stats.marcasHoy, icon: <Fingerprint size={22} />, color: 'blue' },
    { label: 'Marcas esta semana', value: stats.marcasSemana, icon: <Clock size={22} />, color: 'green' },
    { label: 'Justificaciones pendientes', value: stats.pendientes, icon: <ClipboardCheck size={22} />, color: 'yellow' },
    { label: 'Empleados activos', value: stats.empleados, icon: <Users size={22} />, color: 'blue' },
  ];

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Resumen general del sistema de control de asistencia</p>
      </div>
      <div className="page-body">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, borderTopColor: 'var(--color-accent)' }} />
          </div>
        ) : (
          <div className="stat-grid">
            {cards.map((c, i) => (
              <div className="stat-card" key={i} id={`stat-card-${i}`}>
                <div className={`stat-icon ${c.color}`}>{c.icon}</div>
                <div>
                  <div className="stat-number">{c.value.toLocaleString()}</div>
                  <div className="stat-label">{c.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card" style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Accesos rápidos</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
            Use el menú lateral para navegar entre las secciones del portal.
            Los reportes están limitados a un rango máximo de <strong style={{ color: 'var(--color-text)' }}>6 meses</strong>.
          </p>
        </div>
      </div>
    </>
  );
}
