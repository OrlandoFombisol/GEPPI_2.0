import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, AlertTriangle, CheckCircle2, ClipboardCheck, ChevronRight, TrendingUp, MinusCircle } from 'lucide-react'
import { inspeccionDB, empresaDB, planTrabajoDB } from '@/db'
import { useUser } from '@/contexts/UserContext'
import { TIPOS_INSPECCION, calcularCumplimiento } from './items'
import InspeccionForm from './InspeccionForm'
import InspeccionDetalle from './InspeccionDetalle'

// ── Anillo SVG de cumplimiento ────────────────────────────────────────────────
function RingPct({ pct, size = 52 }) {
  const stroke = 5
  const r      = (size - stroke * 2) / 2
  const circ   = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  const color  = pct >= 85 ? '#16A34A' : pct >= 60 ? '#D97706' : '#DC2626'
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 900, color }}>{pct}%</span>
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
  const estadoLabel = pct >= 85 ? 'Aprobado' : pct >= 60 ? 'Parcial' : 'Crítico'
  const estadoCls   = pct >= 85
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : pct >= 60
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-red-50 text-red-700 border-red-200'

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      className="w-full text-left bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden"
    >
      {/* Acento de color del tipo */}
      <div style={{ height: 3, background: meta.color || '#64748b' }} />
      <div className="p-4 flex items-center gap-3">
        {/* Emoji tipo */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: `${meta.color}15` }}>
          {meta.emoji}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {inspeccion.empresa?.razon_social || '—'}
            </p>
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${estadoCls}`}>
              {estadoLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate">
            {meta.label} · {fechaFmt} · {inspeccion.inspector}
          </p>
          {noCumplen.length > 0 && (
            <p className="text-xs text-red-500 font-medium mt-0.5 flex items-center gap-1">
              <AlertTriangle size={10} />
              {noCumplen.length} no conforme{noCumplen.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <RingPct pct={pct} size={48} />
        <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />
      </div>
    </motion.button>
  )
}

// ── Chip de filtro por tipo ───────────────────────────────────────────────────
function ChipTipo({ meta, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all whitespace-nowrap flex-shrink-0',
        active ? 'text-white shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
      ].join(' ')}
      style={active ? { background: meta.color, borderColor: meta.color } : {}}
    >
      {meta.emoji} {meta.label}
    </button>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Inspecciones() {
  const { user }  = useUser()
  const [inspecciones,  setInspecciones]  = useState([])
  const [empresas,      setEmpresas]      = useState([])
  const [actividades,   setActividades]   = useState([])
  const [cargando,      setCargando]      = useState(true)
  const [vistaForm,     setVistaForm]     = useState(false)
  const [detalleId,     setDetalleId]     = useState(null)
  const [filtroTipo,    setFiltroTipo]    = useState('')
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
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

  const total     = inspecciones.length
  const nonConf   = inspecciones.filter(i => (i.items || []).some(it => it.resultado === 'NO_CUMPLE')).length
  const aprobadas = inspecciones.filter(i => calcularCumplimiento(i.items || []) >= 85).length
  const avgPct    = total > 0
    ? Math.round(inspecciones.reduce((s, i) => s + calcularCumplimiento(i.items || []), 0) / total)
    : 0

  const detalleInspeccion = inspecciones.find(i => i.id === detalleId) || null

  return (
    <>
    {/* Modales superpuestos — no reemplazan la página */}
    <AnimatePresence>
      {vistaForm && (
        <InspeccionForm
          empresas={empresas}
          actividadesPAT={actividades}
          usuarioId={user?.id}
          onGuardado={() => { setVistaForm(false); cargarDatos() }}
          onCancelar={() => setVistaForm(false)}
        />
      )}
      {detalleInspeccion && (
        <InspeccionDetalle
          inspeccion={detalleInspeccion}
          onVolver={() => setDetalleId(null)}
        />
      )}
    </AnimatePresence>
    <div> {/* wrapper para el return único */}
    <div className="p-3 sm:p-6 space-y-5">

      {/* ── Cabecera ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardCheck size={22} className="text-sky-700" strokeWidth={1.8} />
            Inspecciones de Seguridad
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Registro y seguimiento de inspecciones SST por tipo y empresa
          </p>
        </div>
        <button
          onClick={() => setVistaForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus size={15} /> Nueva inspección
        </button>
      </div>

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total realizadas',   value: total,        cls: 'text-slate-800',  bg: 'bg-slate-50',   icon: ClipboardCheck, iconCls: 'text-slate-400' },
          { label: 'Aprobadas ≥85%',     value: aprobadas,    cls: 'text-emerald-700',bg: 'bg-emerald-50', icon: CheckCircle2,   iconCls: 'text-emerald-400' },
          { label: 'Con hallazgos',       value: nonConf,      cls: nonConf > 0 ? 'text-red-700' : 'text-slate-800', bg: nonConf > 0 ? 'bg-red-50' : 'bg-slate-50', icon: AlertTriangle, iconCls: nonConf > 0 ? 'text-red-400' : 'text-slate-400' },
          { label: 'Cumplimiento prom.', value: `${avgPct}%`, cls: avgPct >= 85 ? 'text-emerald-700' : avgPct >= 60 ? 'text-amber-700' : 'text-red-700', bg: 'bg-white', icon: TrendingUp, iconCls: 'text-sky-400' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
            className={`${s.bg} rounded-xl border border-slate-100 p-4 flex items-start justify-between`}
          >
            <div>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide leading-tight">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
            </div>
            <s.icon size={18} className={`mt-0.5 ${s.iconCls}`} strokeWidth={1.8} />
          </motion.div>
        ))}
      </div>

      {/* ── Filtros ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2.5">
        {/* Búsqueda + empresa */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Empresa o inspector…"
              className="w-full h-8 pl-7 pr-3 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            />
          </div>
          {empresas.length > 1 && (
            <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)}
              className="h-8 px-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white max-w-[150px]">
              <option value="">Todas las empresas</option>
              {empresas.map(e => <option key={e.id} value={String(e.id)}>{e.razonSocial}</option>)}
            </select>
          )}
        </div>
        {/* Chips por tipo */}
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          <button
            onClick={() => setFiltroTipo('')}
            className={[
              'px-2.5 py-1 rounded-full text-xs font-semibold border transition-all flex-shrink-0',
              !filtroTipo ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200',
            ].join(' ')}
          >
            Todos
          </button>
          {TIPOS_INSPECCION.map(meta => (
            <ChipTipo key={meta.value} meta={meta}
              active={filtroTipo === meta.value}
              onClick={() => setFiltroTipo(filtroTipo === meta.value ? '' : meta.value)} />
          ))}
        </div>
      </div>

      {/* ── Lista ─────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {cargando ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-white rounded-xl border border-slate-100 animate-pulse" />
            ))}
          </div>
        ) : lista.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-xl border border-slate-100"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <ClipboardCheck size={26} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-600">
              {filtroTipo || filtroEmpresa || busqueda ? 'Sin resultados' : 'Sin inspecciones registradas'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {filtroTipo || filtroEmpresa || busqueda
                ? 'Prueba con otros filtros'
                : 'Haz clic en "Nueva inspección" para comenzar'}
            </p>
          </motion.div>
        ) : (
          <motion.div key="list" className="space-y-2.5">
            <p className="text-xs text-slate-400 font-medium px-1">
              {lista.length} inspección{lista.length !== 1 ? 'es' : ''}
              {(filtroTipo || filtroEmpresa || busqueda) ? ' (filtrado)' : ''}
            </p>
            {lista.map((ins, i) => (
              <TarjetaInspeccion key={ins.id} inspeccion={ins} index={i}
                onClick={() => setDetalleId(ins.id)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
    </> // cierre wrapper modales
  )
}
