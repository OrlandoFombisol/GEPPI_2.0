import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronRight, Search, TrendingUp, AlertTriangle, CheckCircle2, ClipboardCheck } from 'lucide-react'
import { inspeccionDB, empresaDB, planTrabajoDB } from '@/db'
import { useUser } from '@/contexts/UserContext'
import { TIPOS_INSPECCION, calcularCumplimiento } from './items'
import InspeccionForm from './InspeccionForm'
import InspeccionDetalle from './InspeccionDetalle'

// ── Ring de cumplimiento SVG ──────────────────────────────────────────────────
function RingPct({ pct, size = 64 }) {
  const stroke = 6
  const r      = (size - stroke * 2) / 2
  const circ   = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  const color  = pct >= 85 ? '#16A34A' : pct >= 60 ? '#D97706' : '#DC2626'
  const bg     = pct >= 85 ? '#dcfce7' : pct >= 60 ? '#fef3c7' : '#fee2e2'
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill={bg} stroke="#e2e8f0" strokeWidth={stroke} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size < 56 ? 11 : 13, fontWeight: 900, color, lineHeight: 1 }}>{pct}%</span>
      </div>
    </div>
  )
}

// ── Tarjeta de inspección ─────────────────────────────────────────────────────
function TarjetaInspeccion({ inspeccion, onClick, index }) {
  const items     = inspeccion.items || []
  const pct       = calcularCumplimiento(items)
  const noCumplen = items.filter(i => i.resultado === 'NO_CUMPLE')
  const meta      = TIPOS_INSPECCION.find(t => t.value === inspeccion.tipo) || {}
  const fechaFmt  = inspeccion.fecha
    ? new Date(inspeccion.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'
  const estado    = pct >= 85 ? 'Aprobado' : pct >= 60 ? 'Parcial' : 'Crítico'
  const estadoCls = pct >= 85
    ? 'bg-emerald-100 text-emerald-700'
    : pct >= 60 ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-700'

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.10)' }}
      whileTap={{ scale: 0.985 }}
      className="w-full text-left bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
      style={{ display: 'block' }}
    >
      {/* Barra de color por tipo */}
      <div style={{ height: 4, background: meta.color || '#64748b' }} />

      <div className="p-4 flex items-center gap-4">
        {/* Emoji tipo */}
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: `${meta.color}18` }}>
          {meta.emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-bold text-slate-800 truncate">
              {inspeccion.empresa?.razon_social || '—'}
            </p>
            <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${estadoCls}`}>
              {estado}
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate">
            {meta.label} · {fechaFmt} · {inspeccion.inspector}
          </p>
          {noCumplen.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5">
              <AlertTriangle size={11} className="text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600 font-medium truncate">
                {noCumplen.length} no conforme{noCumplen.length > 1 ? 's' : ''}: {noCumplen.slice(0, 2).map(i => i.label).join(', ')}{noCumplen.length > 2 ? '…' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Ring + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <RingPct pct={pct} size={52} />
          <ChevronRight size={16} className="text-slate-300" />
        </div>
      </div>
    </motion.button>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, gradient, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl p-4 text-white relative overflow-hidden"
      style={{ background: gradient }}
    >
      <div className="absolute right-3 top-3 opacity-20">
        <Icon size={36} />
      </div>
      <p className="text-3xl font-black leading-none">{value}</p>
      <p className="text-xs font-semibold mt-1 opacity-80">{label}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </motion.div>
  )
}

// ── Chip de filtro por tipo ───────────────────────────────────────────────────
function ChipTipo({ meta, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap',
        active
          ? 'text-white shadow-sm'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
      ].join(' ')}
      style={active ? { background: meta.color, borderColor: meta.color } : {}}
    >
      <span>{meta.emoji}</span> {meta.label}
    </button>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse" />
      ))}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Inspecciones() {
  const { user } = useUser()
  const [inspecciones,  setInspecciones]  = useState([])
  const [empresas,      setEmpresas]      = useState([])
  const [actividades,   setActividades]   = useState([])
  const [cargando,      setCargando]      = useState(true)
  const [vistaForm,     setVistaForm]     = useState(false)
  const [detalleId,     setDetalleId]     = useState(null)
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [filtroTipo,    setFiltroTipo]    = useState('')
  const [busqueda,      setBusqueda]      = useState('')

  const cargarDatos = async () => {
    setCargando(true)
    try {
      const [ins, emp, acts] = await Promise.all([
        inspeccionDB.getAll(),
        empresaDB.getAll(),
        planTrabajoDB.getAll(),
      ])
      setInspecciones(ins)
      setEmpresas(emp)
      setActividades(acts)
    } catch (err) {
      console.error('Inspecciones:', err)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const lista = inspecciones.filter(i => {
    if (filtroEmpresa && String(i.empresaId) !== filtroEmpresa) return false
    if (filtroTipo    && i.tipo !== filtroTipo) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      if (!(i.empresa?.razon_social || '').toLowerCase().includes(q) &&
          !(i.inspector || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const total  = inspecciones.length
  const nonConf = inspecciones.filter(i => (i.items || []).some(it => it.resultado === 'NO_CUMPLE')).length
  const avgPct  = total > 0
    ? Math.round(inspecciones.reduce((s, i) => s + calcularCumplimiento(i.items || []), 0) / total)
    : 0
  const aprobadas = inspecciones.filter(i => calcularCumplimiento(i.items || []) >= 85).length

  const detalleInspeccion = inspecciones.find(i => i.id === detalleId) || null

  if (vistaForm) {
    return (
      <InspeccionForm
        empresas={empresas}
        actividadesPAT={actividades}
        usuarioId={user?.id}
        onGuardado={() => { setVistaForm(false); cargarDatos() }}
        onCancelar={() => setVistaForm(false)}
      />
    )
  }

  if (detalleInspeccion) {
    return (
      <InspeccionDetalle
        inspeccion={detalleInspeccion}
        onVolver={() => setDetalleId(null)}
      />
    )
  }

  return (
    <div className="min-h-full bg-slate-50">

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-5 pt-6 pb-5"
        style={{ background: 'linear-gradient(135deg, #0f2d6e 0%, #1b62cc 60%, #2563eb 100%)' }}>
        {/* Circles deco */}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />
        <div className="absolute right-16 bottom-0 w-24 h-24 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #39B54A, transparent)' }} />

        <div className="relative flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center">
                <ClipboardCheck size={15} className="text-white" />
              </div>
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-widest">SST</span>
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">Inspecciones</h1>
            <p className="text-sm text-blue-200 mt-0.5">Seguridad &amp; Cumplimiento</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setVistaForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold shadow-lg"
            style={{ background: 'linear-gradient(135deg, #39B54A, #16a34a)', color: '#fff', boxShadow: '0 4px 20px rgba(57,181,74,0.4)' }}
          >
            <Plus size={16} /> Nueva
          </motion.button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Realizadas', value: total,       icon: ClipboardCheck, g: 'rgba(255,255,255,0.12)',   d: 0 },
            { label: 'Aprobadas',  value: aprobadas,   icon: CheckCircle2,   g: 'rgba(57,181,74,0.25)',     d: 0.08 },
            { label: 'C/Hallazgos',value: nonConf,     icon: AlertTriangle,  g: 'rgba(239,68,68,0.25)',     d: 0.16 },
            { label: 'Promedio',   value: `${avgPct}%`,icon: TrendingUp,     g: 'rgba(255,255,255,0.10)',   d: 0.24 },
          ].map(k => (
            <motion.div key={k.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: k.d, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-xl p-2.5 text-center relative overflow-hidden"
              style={{ background: k.g, border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <p className="text-xl font-black text-white leading-none">{k.value}</p>
              <p className="text-xs text-blue-200 mt-0.5 leading-tight">{k.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">

        {/* ── Filtro tipo ─────────────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFiltroTipo('')}
            className={[
              'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
              !filtroTipo
                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
            ].join(' ')}
          >
            Todos
          </button>
          {TIPOS_INSPECCION.map(meta => (
            <ChipTipo key={meta.value} meta={meta} active={filtroTipo === meta.value}
              onClick={() => setFiltroTipo(filtroTipo === meta.value ? '' : meta.value)} />
          ))}
        </div>

        {/* ── Búsqueda + empresa ──────────────────────────────────────────── */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar empresa o inspector…"
              className="w-full h-9 pl-8 pr-3 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
            />
          </div>
          {empresas.length > 1 && (
            <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)}
              className="h-9 px-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm max-w-[140px]">
              <option value="">Todas</option>
              {empresas.map(e => <option key={e.id} value={String(e.id)}>{e.razonSocial}</option>)}
            </select>
          )}
        </div>

        {/* ── Lista ───────────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {cargando ? (
            <Skeleton />
          ) : lista.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <ClipboardCheck size={36} className="text-slate-300" />
              </div>
              <p className="text-base font-bold text-slate-600">
                {filtroTipo || filtroEmpresa || busqueda ? 'Sin resultados' : 'Sin inspecciones'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {filtroTipo || filtroEmpresa || busqueda
                  ? 'Prueba con otros filtros'
                  : 'Registra la primera inspección con el botón Nueva'}
              </p>
            </motion.div>
          ) : (
            <motion.div key="list" className="space-y-3">
              <p className="text-xs text-slate-400 font-medium px-1">{lista.length} inspección{lista.length !== 1 ? 'es' : ''}</p>
              {lista.map((ins, i) => (
                <TarjetaInspeccion key={ins.id} inspeccion={ins} index={i} onClick={() => setDetalleId(ins.id)} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-6" />
      </div>
    </div>
  )
}
