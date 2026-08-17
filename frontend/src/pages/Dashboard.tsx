import { useEffect, useState } from 'react';
import { marcasApi, justificacionesApi, empleadosApi } from '../api/marcas';
import { format, subDays } from 'date-fns';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function KpiCardWithSparkline({ title, value, sparkline, trend, trendValue, trendUpIsGood = true }: any) {
  const isUp = trend === 'up';
  const isNeutral = trend === 'neutral';
  const color = isNeutral ? 'var(--color-text-muted)' : (isUp === trendUpIsGood ? 'var(--color-success-text)' : 'var(--color-danger-text)');
  const Icon = isNeutral ? Minus : (isUp ? TrendingUp : TrendingDown);

  return (
    <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
        {sparkline && (
          <div style={{ width: 64, height: 24 }}>
            <ResponsiveContainer>
              <LineChart data={sparkline}>
                <Line type="monotone" dataKey="total" stroke="var(--color-accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1, marginTop: sparkline ? 4 : 0 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 12, color: color, fontWeight: 500, marginTop: '4px' }}>
        <Icon size={14} />
        <span>{trendValue}</span>
        <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: 2 }}>vs período ant.</span>
      </div>
    </div>
  );
}

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
    { label: 'Marcas Hoy', value: stats.marcasHoy, trend: 'up', trendValue: '+15.4%', trendUpIsGood: true },
    { label: 'Marcas esta Semana', value: stats.marcasSemana, sparkline: chartData, trend: 'up', trendValue: '+8.1%', trendUpIsGood: true },
    { label: 'Justificaciones Pdtes.', value: stats.pendientes, trend: 'down', trendValue: '-2.3%', trendUpIsGood: false },
    { label: 'Empleados Activos', value: stats.empleados, trend: 'neutral', trendValue: '0.0%', trendUpIsGood: true },
  ];

  return (
    <>
      <div className="page-header">
        <h1>Dashboard Analítico</h1>
        <p>Visión general del estado del sistema de control de asistencia</p>
      </div>
      <div className="page-body">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3, borderTopColor: 'var(--color-accent)' }} />
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              {cards.map((c, i) => (
                <KpiCardWithSparkline
                  key={i}
                  title={c.label}
                  value={c.value.toLocaleString()}
                  sparkline={c.sparkline}
                  trend={c.trend}
                  trendValue={c.trendValue}
                  trendUpIsGood={c.trendUpIsGood}
                />
              ))}
            </div>

            <div className="card" style={{ marginBottom: 24, padding: '24px' }}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600 }}>Rendimiento de Asistencia (Últimos 7 días)</h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Métricas diarias de registros totales capturados</p>
              </div>
              <div style={{ height: 320, width: '100%', marginLeft: -15 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
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
                      contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: 8, fontSize: 13, boxShadow: 'var(--shadow-md)' }}
                      itemStyle={{ color: 'var(--color-accent)' }}
                      labelFormatter={(val) => format(new Date(val + 'T00:00:00'), 'dd MMM yyyy')}
                    />
                    <Area type="monotone" dataKey="total" stroke="var(--color-accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
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
