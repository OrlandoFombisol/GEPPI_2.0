import { useState, useEffect } from 'react'
import { Plus, ClipboardList, Filter } from 'lucide-react'
import { inspeccionDB, empresaDB, planTrabajoDB } from '@/db'
import { useUser } from '@/contexts/UserContext'
import { TIPOS_INSPECCION, calcularCumplimiento } from './items'
import InspeccionForm from './InspeccionForm'
import InspeccionDetalle from './InspeccionDetalle'

function BadgeTipo({ tipo }) {
  const meta = TIPOS_INSPECCION.find(t => t.value === tipo)
  if (!meta) return null
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${meta.bg}`}>
      {meta.emoji} {meta.label}
    </span>
  )
}

function PctCircle({ pct }) {
  const color = pct >= 85 ? '#16A34A' : pct >= 60 ? '#D97706' : '#DC2626'
  return (
    <div className="flex flex-col items-center">
      <span className="text-xl font-black" style={{ color }}>{pct}%</span>
      <span className="text-xs text-slate-400">cumplim.</span>
    </div>
  )
}

function TarjetaInspeccion({ inspeccion, onClick }) {
  const items = inspeccion.items || []
  const pct   = calcularCumplimiento(items)
  const noCumplen = items.filter(i => i.resultado === 'NO_CUMPLE').length
  const fechaFmt  = inspeccion.fecha
    ? new Date(inspeccion.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <BadgeTipo tipo={inspeccion.tipo} />
          </div>
          <p className="text-sm font-semibold text-slate-800 truncate">
            {inspeccion.empresa?.razon_social || '—'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{fechaFmt} · {inspeccion.inspector}</p>
          {noCumplen > 0 && (
            <p className="text-xs text-red-600 font-medium mt-1.5">
              ⚠ {noCumplen} ítem(s) no cumplen
            </p>
          )}
        </div>
        <PctCircle pct={pct} />
      </div>
    </button>
  )
}

export default function Inspecciones() {
  const { user } = useUser()
  const [inspecciones,   setInspecciones]   = useState([])
  const [empresas,       setEmpresas]       = useState([])
  const [actividades,    setActividades]    = useState([])
  const [cargando,       setCargando]       = useState(true)
  const [vistaForm,      setVistaForm]      = useState(false)
  const [detalleId,      setDetalleId]      = useState(null)
  const [filtroEmpresa,  setFiltroEmpresa]  = useState('')
  const [filtroTipo,     setFiltroTipo]     = useState('')

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

  const lista = inspecciones.filter(i =>
    (!filtroEmpresa || String(i.empresaId) === filtroEmpresa) &&
    (!filtroTipo    || i.tipo === filtroTipo)
  )

  const detalleInspeccion = inspecciones.find(i => i.id === detalleId) || null

  // Stats rápidas
  const total      = inspecciones.length
  const noCumpla   = inspecciones.filter(i =>
    (i.items || []).some(it => it.resultado === 'NO_CUMPLE')
  ).length
  const avgPct     = total > 0
    ? Math.round(inspecciones.reduce((s, i) => s + calcularCumplimiento(i.items || []), 0) / total)
    : 0

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
    <div className="p-4 max-w-2xl mx-auto space-y-5">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList size={20} className="text-primary-600" />
            Inspecciones de Seguridad
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Registro y seguimiento de inspecciones SST</p>
        </div>
        <button
          onClick={() => setVistaForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Nueva
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',             value: total,   color: 'text-slate-800' },
          { label: 'Con no conformidad',value: noCumpla, color: noCumpla > 0 ? 'text-red-600' : 'text-slate-800' },
          { label: 'Cumplimiento prom.',value: `${avgPct}%`, color: avgPct >= 85 ? 'text-green-600' : avgPct >= 60 ? 'text-amber-600' : 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Filter size={14} />
          <span className="text-xs font-medium">Filtrar:</span>
        </div>
        <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)}
          className="flex-1 min-w-0 h-8 px-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Todas las empresas</option>
          {empresas.map(e => <option key={e.id} value={String(e.id)}>{e.razonSocial}</option>)}
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="flex-1 min-w-0 h-8 px-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Todos los tipos</option>
          {TIPOS_INSPECCION.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
        </select>
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="text-center py-16 text-slate-400 text-sm">Cargando…</div>
      ) : lista.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500 font-medium">Sin inspecciones registradas</p>
          <p className="text-xs text-slate-400 mt-1">Toca "Nueva" para registrar la primera inspección</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map(ins => (
            <TarjetaInspeccion key={ins.id} inspeccion={ins} onClick={() => setDetalleId(ins.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
