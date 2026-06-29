import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer,
} from 'recharts'
import {
  Users, ClipboardList, AlertTriangle, XCircle,
  Package, Bell, RefreshCw, Building2, Shield, Clock, Calendar,
} from 'lucide-react'
import { format }                  from 'date-fns'
import { es }                      from 'date-fns/locale'
import { SISTEMA, NIVEL_ALERTA }   from '@/constants'
import { formatearFechaHora, formatearFecha } from '@/utils/dates'
import { StatsCard, Card, Badge, Button } from '@/components/ui'
import { useDashboardData }         from './hooks/useDashboardData'
import { motion }                   from 'framer-motion'

const sectionVariants = {
  hidden:  { opacity: 0, y: 22 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
}

// ─── Skeleton de carga ────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={['bg-slate-200 rounded-xl animate-pulse', className].join(' ')} />
}

// ─── Tooltip personalizado para BarChart ──────────────────────────────────────
function TooltipBar({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-primary-800 font-bold">{payload[0].value} entrega{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  )
}

// ─── Tooltip personalizado para PieChart ─────────────────────────────────────
function TooltipPie({ active, payload }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700">{name}</p>
      <p className="font-bold text-slate-900">{value} registro{value !== 1 ? 's' : ''}</p>
    </div>
  )
}

// ─── Sección: Alertas recientes ───────────────────────────────────────────────
const ALERTA_CFG = {
  CRITICO: { cls: 'border-red-200 bg-red-50',     dot: 'bg-red-500'   },
  WARNING: { cls: 'border-yellow-200 bg-yellow-50', dot: 'bg-yellow-500' },
  INFO:    { cls: 'border-blue-200 bg-blue-50',    dot: 'bg-blue-500'  },
}

function AlertaItem({ alerta }) {
  const cfg = ALERTA_CFG[alerta.nivel] || ALERTA_CFG.INFO
  return (
    <div className={['flex items-start gap-3 px-4 py-3 rounded-xl border text-xs', cfg.cls].join(' ')}>
      <span className={['w-2 h-2 rounded-full mt-1 flex-shrink-0', cfg.dot].join(' ')} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 truncate">{alerta.mensaje || alerta.tipo}</p>
        <p className="text-slate-500 mt-0.5">{formatearFechaHora(alerta.fechaGeneracion)}</p>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Page() {
  const { datos, loading, recargar } = useDashboardData()

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

      {/* ── Cabecera ─────────────────────────────────────────────────────── */}
      <motion.div
        variants={sectionVariants} custom={0} initial="hidden" animate="visible"
        className="flex items-start justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {SISTEMA.NOMBRE_COMPLETO} · {SISTEMA.CODIGO_DOCUMENTO} v{SISTEMA.VERSION_MATRIZ}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {datos?.ultimaActualizacion && (
            <span className="text-xs text-slate-400">
              Actualizado: {format(datos.ultimaActualizacion, 'HH:mm', { locale: es })}
            </span>
          )}
          <Button variant="ghost" size="sm" iconLeft={RefreshCw} onClick={recargar} disabled={loading}>
            Actualizar
          </Button>
        </div>
      </motion.div>

      {/* ── KPIs ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatsCard icon={Users}         value={datos?.kpis.trabajadoresActivos ?? 0} label="Trabajadores activos"    color="primary" delay={0.05} />
          <StatsCard icon={ClipboardList} value={datos?.kpis.entregasEsteMes ?? 0}     label="Entregas este mes"       color="success" delay={0.12} />
          <StatsCard icon={AlertTriangle} value={datos?.kpis.eppProximos ?? 0}         label="EPP por vencer (30d)"    color="warning" delay={0.19} />
          <StatsCard icon={XCircle}       value={datos?.kpis.eppVencidos ?? 0}         label="EPP vencidos"            color="danger"  delay={0.26} />
          <StatsCard icon={Package}       value={datos?.kpis.stockCritico ?? 0}        label="Ítems stock crítico"     color="orange"  delay={0.33} />
          <StatsCard icon={Bell}          value={datos?.kpis.alertasNoLeidas ?? 0}     label="Alertas activas"         color="neutral" delay={0.40} />
        </div>
      )}

      {/* ── Fila de gráficas principales ─────────────────────────────────── */}
      <motion.div variants={sectionVariants} custom={3} initial="hidden" animate="visible"
                  className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Entregas por mes */}
        <Card className="lg:col-span-3" title="Entregas por mes" subtitle="Últimos 6 meses">
          {loading ? (
            <Skeleton className="h-44 sm:h-56" />
          ) : (
            <ResponsiveContainer width="100%" height={typeof window !== 'undefined' && window.innerWidth < 640 ? 180 : 220}>
              <BarChart data={datos?.chartEntregas || []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<TooltipBar />} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="cantidad" fill="#1e40af" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Estado de EPP (Pie) */}
        <Card className="lg:col-span-2" title="Estado de EPP" subtitle="Distribución por semáforo">
          {loading ? (
            <Skeleton className="h-56" />
          ) : !datos?.chartEstados?.length ? (
            <div className="h-56 flex items-center justify-center text-sm text-slate-400">
              Sin entregas registradas aún.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={datos.chartEstados}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {datos.chartEstados.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipPie />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </motion.div>

      {/* ── Inventario crítico ────────────────────────────────────────────── */}
      {!loading && datos?.chartInventario?.length > 0 && (
        <Card title="Inventario crítico" subtitle="EPP con menor stock disponible (relativo al mínimo)">
          <ResponsiveContainer width="100%" height={datos.chartInventario.length * 38 + 20}>
            <BarChart
              data={datos.chartInventario}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="nombre"
                width={160}
                tick={{ fontSize: 11, fill: '#475569' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(v, name) => [v, name === 'stock' ? 'Stock actual' : 'Mínimo']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="minimo" fill="#e2e8f0" radius={[0, 3, 3, 0]} maxBarSize={18} name="minimo" />
              <Bar dataKey="stock"  fill="#1e40af" radius={[0, 3, 3, 0]} maxBarSize={18} name="stock"
                label={{ position: 'right', fontSize: 10, fill: '#475569' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── EPP próximos a vencer ────────────────────────────────────────── */}
      {(!loading && (datos?.eppProximosLista?.length > 0)) && (
        <motion.div variants={sectionVariants} custom={4} initial="hidden" animate="visible">
          <Card title="EPP próximos a vencer" subtitle="Vencidos o con menos de 30 días — por trabajador">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-3 py-2 text-left text-slate-500 font-semibold uppercase tracking-wide">EPP</th>
                    <th className="px-3 py-2 text-left text-slate-500 font-semibold uppercase tracking-wide">Trabajador</th>
                    <th className="px-3 py-2 text-right text-slate-500 font-semibold uppercase tracking-wide">Vence</th>
                    <th className="px-3 py-2 text-right text-slate-500 font-semibold uppercase tracking-wide">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.eppProximosLista.map(item => {
                    const vencido = item.estado === 'VENCIDO'
                    return (
                      <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                        <td className="px-3 py-2.5 text-slate-800 font-medium max-w-[160px] truncate">
                          <span>{item.eppNombre}</span>
                          {item.esDotacion && (
                            <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">
                              Art.230
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 max-w-[140px] truncate">{item.trabajador}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600 whitespace-nowrap">
                          <span className="flex items-center justify-end gap-1">
                            <Calendar size={11} className="text-slate-400" />
                            {item.fechaVence ? formatearFecha(item.fechaVence) : '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={[
                            'inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold',
                            vencido
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700',
                          ].join(' ')}>
                            {vencido
                              ? `Vencido hace ${Math.abs(item.dias)}d`
                              : `Vence en ${item.dias}d`
                            }
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── Fila inferior ────────────────────────────────────────────────── */}
      <motion.div variants={sectionVariants} custom={5} initial="hidden" animate="visible"
                  className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Alertas recientes */}
        <Card title="Alertas activas" subtitle="No leídas">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : !datos?.alertasRecientes?.length ? (
            <div className="py-8 text-center">
              <Shield size={28} className="text-green-400 mx-auto mb-2" strokeWidth={1.5} />
              <p className="text-sm text-slate-400">Sin alertas activas. ¡Todo en orden!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {datos.alertasRecientes.map(a => (
                <AlertaItem key={a.id} alerta={a} />
              ))}
            </div>
          )}
        </Card>

        {/* Información del sistema */}
        <Card title="Información del sistema" subtitle={SISTEMA.CODIGO_DOCUMENTO}>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Empresa */}
              {datos?.empresa && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                  <Building2 size={16} className="text-primary-700 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{datos.empresa.razonSocial}</p>
                    <p className="text-xs text-slate-400 mt-0.5">NIT {datos.empresa.nit}</p>
                  </div>
                </div>
              )}

              {/* Indicadores de la BD */}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                {[
                  ['Sedes activas',       datos?.sedesActivas ?? 0      ],
                  ['EPP en catálogo',     datos?.kpis.totalEPP ?? 0     ],
                  ['Total entregas',      datos?.kpis.totalEntregas ?? 0 ],
                  ['Versión matriz',      `v${SISTEMA.VERSION_MATRIZ}`   ],
                  ['Normativa',           'Res. 0312/2019'               ],
                  ['Decreto',             'DUR 1072/2015'                ],
                ].map(([label, val]) => (
                  <div key={label}>
                    <dt className="text-slate-400 font-medium">{label}</dt>
                    <dd className="text-slate-700 font-semibold mt-0.5">{val}</dd>
                  </div>
                ))}
              </dl>

              {/* Badges de estado */}
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="success">Base local activa</Badge>
                <Badge variant="info">LAN disponible</Badge>
                <Badge variant="primary">GEPPI v{SISTEMA.VERSION}</Badge>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

    </div>
  )
}
