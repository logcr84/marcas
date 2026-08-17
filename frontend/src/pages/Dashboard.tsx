import { useEffect, useState } from 'react';
import { marcasApi, justificacionesApi, empleadosApi } from '../api/marcas';
import { format, subDays } from 'date-fns';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({ marcasHoy: 0, pendientes: 0, empleados: 0, marcasSemana: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hoy = format(new Date(), 'yyyy-MM-dd');
    const semanaAtras = format(subDays(new Date(), 6), 'yyyy-MM-dd');
    Promise.all([
      marcasApi.reporteGeneral(hoy, hoy).catch(() => ({ total: 0 })),
      justificacionesApi.listar('PENDIENTE').catch(() => []),
      empleadosApi.listar().catch(() => []),
      marcasApi.reporteGeneral(semanaAtras, hoy).catch(() => ({ total: 0, marcas: [] })),
    ]).then(([hoyData, pendientes, empleados, semana]) => {
      setStats({
        marcasHoy: (hoyData as any).total ?? 0,
        pendientes: (pendientes as any[]).length,
        empleados: (empleados as any[]).length,
        marcasSemana: (semana as any).total ?? 0,
      });

      // Agrupar marcas por día para el gráfico
      const marcas = (semana as any).marcas || [];
      const grouped = marcas.reduce((acc: any, m: any) => {
        const d = format(new Date(m.fechaHoraServidor), 'yyyy-MM-dd');
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      }, {});

      // Llenar datos vacíos para los últimos 7 días
      const d = [];
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        d.push({ date, total: grouped[date] || 0 });
      }
      setChartData(d);

    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Marcas hoy', value: stats.marcasHoy },
    { label: 'Marcas esta semana', value: stats.marcasSemana, sparkline: chartData },
    { label: 'Justificaciones pendientes', value: stats.pendientes },
    { label: 'Empleados activos', value: stats.empleados },
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
          <>
            <div className="stat-grid" style={{ marginBottom: 24 }}>
              {cards.map((c, i) => (
                <div className="card" key={i} style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 500 }}>{c.label}</div>
                    {c.sparkline && (
                      <div style={{ width: 60, height: 24, marginLeft: 10 }}>
                        <ResponsiveContainer>
                          <LineChart data={c.sparkline}>
                            <Line type="monotone" dataKey="total" stroke="var(--color-accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1 }}>
                    {c.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Tendencia de marcas (últimos 7 días)</h2>
              <div style={{ height: 300, width: '100%', marginLeft: -15 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => format(new Date(val + 'T00:00:00'), 'dd MMM')} 
                      stroke="var(--color-text-muted)" 
                      fontSize={12} 
                      tickMargin={10} 
                      axisLine={false} 
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 8, fontSize: 13 }}
                      itemStyle={{ color: 'var(--color-accent)' }}
                      labelFormatter={(val) => format(new Date(val + 'T00:00:00'), 'dd MMM yyyy')}
                    />
                    <Area type="monotone" dataKey="total" stroke="var(--color-accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
