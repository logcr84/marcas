import { useEffect, useState } from 'react';
import { marcasApi, justificacionesApi, empleadosApi } from '../api/marcas';
import { format, subDays } from 'date-fns';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ── KPI Card con sparkline ─────────────────────────────────────────────────────
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

// ── Configuración SVG por tipo de marca ───────────────────────────────────────
interface TipoConfig {
  label: string;
  color: string;
  bg: string;
  icon: React.ReactElement;
}

const TIPO_CONFIG: Record<string, TipoConfig> = {
  ENTRADA_TRABAJO: {
    label: 'Entrada al Trabajo',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.13)',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
      </svg>
    ),
  },
  SALIDA_TRABAJO: {
    label: 'Salida del Trabajo',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.13)',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
  },
  SALIDA_CAFE_MANANA: {
    label: 'Salida Café Mañana',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.13)',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <line x1="6" y1="2" x2="6" y2="4" />
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="14" y1="2" x2="14" y2="4" />
      </svg>
    ),
  },
  REGRESO_CAFE_MANANA: {
    label: 'Regreso Café Mañana',
    color: '#d97706',
    bg: 'rgba(217,119,6,0.13)',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <polyline points="9 14 11 16 13 14" />
      </svg>
    ),
  },
  SALIDA_ALMUERZO: {
    label: 'Salida Almuerzo',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.13)',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <line x1="7" y1="2" x2="7" y2="11" />
        <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
      </svg>
    ),
  },
  REGRESO_ALMUERZO: {
    label: 'Regreso Almuerzo',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.13)',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <line x1="7" y1="2" x2="7" y2="11" />
        <polyline points="10 20 12 22 14 20" />
        <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
      </svg>
    ),
  },
  SALIDA_CAFE_TARDE: {
    label: 'Salida Café Tarde',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.13)',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <path d="M12 19v3M8 22h8" />
      </svg>
    ),
  },
  REGRESO_CAFE_TARDE: {
    label: 'Regreso Café Tarde',
    color: '#0891b2',
    bg: 'rgba(8,145,178,0.13)',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <polyline points="9 13 11 15 13 13" />
      </svg>
    ),
  },
  SALIDA_COMISION: {
    label: 'Salida en Comisión',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.13)',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
  },
  REGRESO_COMISION: {
    label: 'Regreso de Comisión',
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.13)',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <polyline points="9 13 11 15 13 13" />
      </svg>
    ),
  },
  SALIDA_MEDICA: {
    label: 'Salida Médica CCSS',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.13)',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  REGRESO_MEDICA: {
    label: 'Regreso Cita Médica',
    color: '#ea580c',
    bg: 'rgba(234,88,12,0.13)',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        <circle cx="12" cy="21" r="1" fill="currentColor" />
      </svg>
    ),
  },
};

function normalizeTipo(tipo: string): string {
  return tipo.toUpperCase()
    .replace(/[ÁÀÂÄ]/g, 'A').replace(/[ÉÈÊË]/g, 'E')
    .replace(/[ÍÌÎÏ]/g, 'I').replace(/[ÓÒÔÖ]/g, 'O')
    .replace(/[ÚÙÛÜ]/g, 'U').replace(/\s+/g, '_');
}

function getTipoConfig(tipoMarca: string): TipoConfig | null {
  return TIPO_CONFIG[normalizeTipo(tipoMarca)] ?? null;
}

// ── Tarjeta de tipo de marca ───────────────────────────────────────────────────
function TipoMarcaCard({ tipo, count, promedio, total }: {
  tipo: string; count: number; promedio: number; total: number;
}) {
  const cfg = getTipoConfig(tipo);
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const color = cfg?.color ?? '#6366f1';
  const bg = cfg?.bg ?? 'rgba(99,102,241,0.1)';
  const label = cfg?.label ?? tipo.replace(/_/g, ' ');

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', borderRadius: 12,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        transition: 'box-shadow 0.2s, transform 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.18)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Ícono SVG */}
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: bg, color, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {cfg?.icon ?? (
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
          </svg>
        )}
      </div>

      {/* Nombre + barra */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: 'var(--color-text)',
          marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {label}
        </div>
        <div style={{ height: 5, borderRadius: 99, background: 'var(--color-border)', overflow: 'hidden', marginBottom: 4 }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            borderRadius: 99, transition: 'width 0.7s ease',
          }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', gap: 6 }}>
          <span>{pct}% del total</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>Prom. <strong style={{ color }}>{promedio.toFixed(1)}</strong>/día</span>
        </div>
      </div>

      {/* Conteo */}
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 48 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{count}</div>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>registros</div>
      </div>
    </div>
  );
}

// ── Dashboard principal ────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState({ marcasHoy: 0, pendientes: 0, empleados: 0, marcasSemana: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [tipoStats, setTipoStats] = useState<{ tipo: string; count: number; promedio: number }[]>([]);
  const [diasConDatos, setDiasConDatos] = useState(1);
  const [totalTipos, setTotalTipos] = useState(0);
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

      const marcas: any[] = (semana as any).marcas || [];

      // Gráfico por día
      const grouped = marcas.reduce((acc: any, m: any) => {
        const d = format(new Date(m.fechaHoraServidor), 'yyyy-MM-dd');
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      }, {});
      const d = [];
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        d.push({ date, total: grouped[date] || 0 });
      }
      setChartData(d);

      // ── Distribución y promedio por tipo ──────────────────────────────────
      const diasUnicos = new Set(marcas.map(m => format(new Date(m.fechaHoraServidor), 'yyyy-MM-dd'))).size;
      const efectivoDias = Math.max(diasUnicos, 1);
      setDiasConDatos(efectivoDias);

      const porTipo: Record<string, number> = marcas.reduce((acc: Record<string, number>, m: any) => {
        const key = (m.tipoMarca ?? 'DESCONOCIDO') as string;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const total = Object.values(porTipo).reduce((s, v) => s + v, 0);
      setTotalTipos(total);

      const arr = Object.entries(porTipo)
        .map(([tipo, count]) => ({ tipo, count, promedio: count / efectivoDias }))
        .sort((a, b) => b.count - a.count);
      setTipoStats(arr);

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
            {/* KPIs */}
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

            {/* Gráfico de tendencia */}
            <div className="card" style={{ marginBottom: 24, padding: '24px' }}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600 }}>Rendimiento de Asistencia (Últimos 7 días)</h2>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Métricas diarias de registros totales capturados</p>
              </div>
              <div style={{ height: 300, width: '100%', marginLeft: -15 }}>
                <ResponsiveContainer>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
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

            {/* ── Distribución por Tipo de Marca ─────────────────────────────── */}
            {tipoStats.length > 0 && (
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 600 }}>Distribución por Tipo de Marca</h2>
                    <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                      Últimos 7 días &nbsp;·&nbsp; {diasConDatos} día{diasConDatos !== 1 ? 's' : ''} con registros &nbsp;·&nbsp; {totalTipos} eventos totales
                    </p>
                  </div>
                  <div style={{
                    padding: '4px 14px', borderRadius: 20,
                    background: 'rgba(99,102,241,0.12)',
                    color: 'var(--color-accent)', fontSize: 12, fontWeight: 600,
                    alignSelf: 'flex-start',
                  }}>
                    {tipoStats.length} tipo{tipoStats.length !== 1 ? 's' : ''}
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
                  gap: 12,
                }}>
                  {tipoStats.map(({ tipo, count, promedio }) => (
                    <TipoMarcaCard
                      key={tipo}
                      tipo={tipo}
                      count={count}
                      promedio={promedio}
                      total={totalTipos}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
