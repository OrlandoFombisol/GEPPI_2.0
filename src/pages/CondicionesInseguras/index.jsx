import { useState, useEffect, useMemo, useCallback } from 'react'
import { ShieldAlert, Plus, Pencil, Trash2, X } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { condicionesDB, empresaDB } from '@/db'

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPOS = [
  { value: 'ACTO_INSEGURO',      label: 'Acto inseguro'        },
  { value: 'CONDICION_INSEGURA', label: 'Condición insegura'   },
]

const ESTADOS = [
  { value: 'IDENTIFICADA', label: 'Identificada', cls: 'text-red-700 bg-red-50 border-red-200'      },
  { value: 'EN_PROCESO',   label: 'En proceso',   cls: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  { value: 'INTERVENIDA',  label: 'Intervenida',  cls: 'text-green-700 bg-green-50 border-green-200' },
]

const PRIORIDADES = [
  { value: 'ALTA',  label: 'Alta',  cls: 'text-red-600 font-bold'    },
  { value: 'MEDIA', label: 'Media', cls: 'text-yellow-600 font-semibold' },
  { value: 'BAJA',  label: 'Baja',  cls: 'text-slate-500'            },
]

const EMPTY = {
  empresaId: '',
  tipo: 'CONDICION_INSEGURA',
  descripcion: '',
  area: '',
  responsable: '',
  prioridad: 'MEDIA',
  estado: 'IDENTIFICADA',
  fechaIdentificacion: new Date().toISOString().slice(0, 10),
  fechaIntervencion: '',
  fechaSeguimiento: '',
  fechaCierre: '',
  observaciones: '',
}

const colorPct = (pct) => pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'

const INP = 'w-full h-9 px-3 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500'
const SEL = 'h-8 px-2.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500'

// ─── Modal crear/editar ───────────────────────────────────────────────────────

function CondicionModal({ form, set, empresas, onClose, onSave, saving, errs }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">

        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-base font-bold text-slate-900">
            {form.id ? 'Editar condición' : 'Nueva condición / acto inseguro'}
          </h2>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5 space-y-4">

          {/* Empresa */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa *</label>
            <select value={form.empresaId}
              onChange={e => set(f => ({ ...f, empresaId: Number(e.target.value) }))}
              className={`${INP} ${errs.empresaId ? 'border-red-400' : ''}`}>
              <option value="">Seleccionar empresa…</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
            </select>
            {errs.empresaId && <p className="text-xs text-red-500 mt-0.5">{errs.empresaId}</p>}
          </div>

          {/* Tipo + Prioridad */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo *</label>
              <select value={form.tipo}
                onChange={e => set(f => ({ ...f, tipo: e.target.value }))}
                className={INP}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Prioridad</label>
              <select value={form.prioridad}
                onChange={e => set(f => ({ ...f, prioridad: e.target.value }))}
                className={INP}>
                {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Descripción *</label>
            <textarea value={form.descripcion}
              onChange={e => set(f => ({ ...f, descripcion: e.target.value }))}
              rows={3}
              placeholder="Describa el acto o condición insegura identificada…"
              className={`w-full px-3 py-2 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none ${errs.descripcion ? 'border-red-400' : 'border-slate-300'}`}
            />
            {errs.descripcion && <p className="text-xs text-red-500 mt-0.5">{errs.descripcion}</p>}
          </div>

          {/* Área + Responsable */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Área / Lugar</label>
              <input value={form.area}
                onChange={e => set(f => ({ ...f, area: e.target.value }))}
                placeholder="Ej: Bodega principal"
                className={INP}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Responsable</label>
              <input value={form.responsable}
                onChange={e => set(f => ({ ...f, responsable: e.target.value }))}
                placeholder="Nombre del responsable"
                className={INP}
              />
            </div>
          </div>

          {/* Estado + Fecha identificación */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Estado *</label>
              <select value={form.estado}
                onChange={e => set(f => ({ ...f, estado: e.target.value }))}
                className={INP}>
                {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha identificación</label>
              <input type="date" value={form.fechaIdentificacion}
                onChange={e => set(f => ({ ...f, fechaIdentificacion: e.target.value }))}
                className={INP}
              />
            </div>
          </div>

          {/* Fechas de seguimiento, intervención y cierre */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha seguimiento</label>
              <input type="date" value={form.fechaSeguimiento || ''}
                onChange={e => set(f => ({ ...f, fechaSeguimiento: e.target.value }))}
                className={INP}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha intervención</label>
              <input type="date" value={form.fechaIntervencion || ''}
                onChange={e => set(f => ({ ...f, fechaIntervencion: e.target.value }))}
                className={INP}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha cierre</label>
              <input type="date" value={form.fechaCierre || ''}
                onChange={e => set(f => ({ ...f, fechaCierre: e.target.value }))}
                className={INP}
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Observaciones</label>
            <textarea value={form.observaciones}
              onChange={e => set(f => ({ ...f, observaciones: e.target.value }))}
              rows={2}
              placeholder="Observaciones adicionales…"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>
        </div>

        {/* Pie */}
        <div className="flex justify-end gap-3 p-5 border-t">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            Cancelar
          </button>
          <button onClick={onSave} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 rounded-lg transition-colors disabled:opacity-50">
            {saving ? 'Guardando…' : form.id ? 'Guardar cambios' : 'Crear registro'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Page() {
  const [condiciones, setCondiciones] = useState([])
  const [empresas,    setEmpresas]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modal,       setModal]       = useState({ open: false, form: { ...EMPTY } })
  const [delId,       setDelId]       = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [errs,        setErrs]        = useState({})

  const [filtroEmpresa,   setFiltroEmpresa]   = useState('TODOS')
  const [filtroTipo,      setFiltroTipo]      = useState('TODOS')
  const [filtroEstado,    setFiltroEstado]    = useState('TODOS')
  const [filtroPrioridad, setFiltroPrioridad] = useState('TODOS')

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [c, e] = await Promise.all([condicionesDB.getAll(), empresaDB.getAll()])
      setCondiciones(c || [])
      setEmpresas(e || [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const empresaMap = useMemo(
    () => Object.fromEntries(empresas.map(e => [e.id, e.razonSocial])),
    [empresas]
  )

  const cumplimiento = useMemo(() => {
    const m = {}
    condiciones.forEach(c => {
      const n = empresaMap[c.empresaId] || `Empresa #${c.empresaId}`
      if (!m[c.empresaId]) m[c.empresaId] = { nombre: n, total: 0, intervenidas: 0 }
      m[c.empresaId].total++
      if (c.estado === 'INTERVENIDA') m[c.empresaId].intervenidas++
    })
    return Object.entries(m)
      .map(([id, d]) => ({
        id: Number(id),
        nombre: d.nombre.length > 20 ? d.nombre.slice(0, 18) + '…' : d.nombre,
        nombreFull: d.nombre,
        total: d.total,
        intervenidas: d.intervenidas,
        pct: d.total > 0 ? Math.round(d.intervenidas / d.total * 100) : 0,
      }))
      .sort((a, b) => b.pct - a.pct)
  }, [condiciones, empresaMap])

  const filtradas = useMemo(() => {
    let r = condiciones
    if (filtroEmpresa   !== 'TODOS') r = r.filter(c => String(c.empresaId) === filtroEmpresa)
    if (filtroTipo      !== 'TODOS') r = r.filter(c => c.tipo      === filtroTipo)
    if (filtroEstado    !== 'TODOS') r = r.filter(c => c.estado    === filtroEstado)
    if (filtroPrioridad !== 'TODOS') r = r.filter(c => c.prioridad === filtroPrioridad)
    return [...r].sort((a, b) => (b.fechaIdentificacion || '').localeCompare(a.fechaIdentificacion || ''))
  }, [condiciones, filtroEmpresa, filtroTipo, filtroEstado, filtroPrioridad])

  const validate = (f) => {
    const e = {}
    if (!f.empresaId)         e.empresaId  = 'Seleccione una empresa'
    if (!f.descripcion?.trim()) e.descripcion = 'La descripción es requerida'
    return e
  }

  const handleSave = async () => {
    const e = validate(modal.form)
    if (Object.keys(e).length) { setErrs(e); return }
    setSaving(true)
    try {
      const { id, ...raw } = modal.form
      // Convertir fechas vacías a null para PostgreSQL
      const data = {
        ...raw,
        fechaIntervencion: raw.fechaIntervencion || null,
        fechaSeguimiento:  raw.fechaSeguimiento  || null,
        fechaCierre:       raw.fechaCierre        || null,
      }
      if (id) await condicionesDB.update(id, data)
      else    await condicionesDB.create(data)
      await cargar()
      setModal({ open: false, form: { ...EMPTY } })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    await condicionesDB.remove(delId)
    setCondiciones(p => p.filter(c => c.id !== delId))
    setDelId(null)
  }

  const abrirNueva  = () => { setErrs({}); setModal({ open: true, form: { ...EMPTY } }) }
  const abrirEditar = (c) => { setErrs({}); setModal({ open: true, form: { ...c } }) }

  const total       = condiciones.length
  const intervenidas = condiciones.filter(c => c.estado === 'INTERVENIDA').length
  const enProceso   = condiciones.filter(c => c.estado === 'EN_PROCESO').length
  const pctGlobal   = total > 0 ? Math.round(intervenidas / total * 100) : 0
  const hayFiltros  = filtroEmpresa !== 'TODOS' || filtroTipo !== 'TODOS' || filtroEstado !== 'TODOS' || filtroPrioridad !== 'TODOS'

  return (
    <div className="p-3 sm:p-6 space-y-5">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert size={22} className="text-orange-600" strokeWidth={1.8} />
            Actos y Condiciones Inseguras
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Indicador: condiciones intervenidas / identificadas × 100
          </p>
        </div>
        <button onClick={abrirNueva}
          className="flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
          <Plus size={15} />
          Nuevo registro
        </button>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total identificadas', value: total,       cls: 'text-slate-800', bg: 'bg-slate-50' },
          { label: 'Intervenidas',        value: intervenidas, cls: 'text-green-700', bg: 'bg-green-50' },
          { label: 'En proceso',          value: enProceso,    cls: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: 'Cumplimiento global', value: `${pctGlobal}%`,
            cls: pctGlobal >= 80 ? 'text-green-700' : pctGlobal >= 50 ? 'text-yellow-700' : 'text-red-700',
            bg: 'bg-white' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl border border-slate-100 p-4`}>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Indicadores por empresa */}
      {cumplimiento.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Cards empresa */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Por empresa</h2>
            {cumplimiento.map(e => (
              <div key={e.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-800" title={e.nombreFull}>{e.nombreFull}</span>
                  <span className={`text-sm font-bold ml-2 flex-shrink-0 ${
                    e.pct >= 80 ? 'text-green-600' : e.pct >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>{e.pct}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${e.pct}%`, background: colorPct(e.pct) }} />
                </div>
                <div className="flex justify-between mt-1.5 text-xs text-slate-400">
                  <span>{e.intervenidas} intervenidas de {e.total}</span>
                  <span>{e.total - e.intervenidas} pendientes</span>
                </div>
              </div>
            ))}
          </div>

          {/* Gráfica */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">
              % Cumplimiento por empresa
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cumplimiento} margin={{ top: 4, right: 8, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="nombre"
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  angle={-30} textAnchor="end" interval={0}
                />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]}
                  tickFormatter={v => `${v}%`} />
                <Tooltip
                  formatter={(v, _n, p) => [`${v}% (${p.payload.intervenidas}/${p.payload.total})`, 'Cumplimiento']}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  labelFormatter={(l, p) => p[0]?.payload?.nombreFull || l}
                />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                  {cumplimiento.map(e => <Cell key={e.id} fill={colorPct(e.pct)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} className={SEL}>
          <option value="TODOS">Todas las empresas</option>
          {empresas.map(e => <option key={e.id} value={String(e.id)}>{e.razonSocial}</option>)}
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className={SEL}>
          <option value="TODOS">Todos los tipos</option>
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className={SEL}>
          <option value="TODOS">Todos los estados</option>
          {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <select value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)} className={SEL}>
          <option value="TODOS">Todas las prioridades</option>
          {PRIORIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        {hayFiltros && (
          <button onClick={() => { setFiltroEmpresa('TODOS'); setFiltroTipo('TODOS'); setFiltroEstado('TODOS'); setFiltroPrioridad('TODOS') }}
            className="text-xs text-primary-600 hover:text-primary-800 font-medium">
            Limpiar filtros
          </button>
        )}
        <span className="ml-auto text-xs text-slate-400">{filtradas.length} registros</span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Descripción', 'Empresa', 'Tipo', 'Área', 'Prioridad', 'Estado', 'F. Identificación', 'F. Seguimiento', 'F. Cierre', 'Observaciones', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={11} className="px-4 py-3">
                      <div className="h-5 bg-slate-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtradas.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                        <ShieldAlert size={22} className="text-orange-500" strokeWidth={1.5} />
                      </div>
                      <p className="text-sm text-slate-500">
                        {hayFiltros
                          ? 'Sin resultados con los filtros aplicados.'
                          : 'No hay registros. Crea el primero con "Nuevo registro".'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filtradas.map(c => {
                const ei = ESTADOS.find(e => e.value === c.estado)
                const pi = PRIORIDADES.find(p => p.value === c.prioridad)
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="text-sm text-slate-900 font-medium line-clamp-2" title={c.descripcion}>
                        {c.descripcion}
                      </p>
                      {c.responsable && <p className="text-xs text-slate-400 mt-0.5">{c.responsable}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap max-w-[150px] truncate">
                      {empresaMap[c.empresaId] || `#${c.empresaId}`}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {TIPOS.find(t => t.value === c.tipo)?.label || c.tipo}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.area || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${pi?.cls || ''}`}>{pi?.label || c.prioridad}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${ei?.cls || ''}`}>
                        {ei?.label || c.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {c.fechaIdentificacion || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {c.fechaSeguimiento || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {c.fechaCierre
                        ? <span className="text-green-700 font-semibold">{c.fechaCierre}</span>
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px]">
                      <p className="line-clamp-2" title={c.observaciones}>{c.observaciones || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => abrirEditar(c)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Editar">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDelId(c.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal crear/editar */}
      {modal.open && (
        <CondicionModal
          form={modal.form}
          set={(fn) => setModal(m => ({ ...m, form: fn(m.form) }))}
          empresas={empresas}
          onClose={() => setModal({ open: false, form: { ...EMPTY } })}
          onSave={handleSave}
          saving={saving}
          errs={errs}
        />
      )}

      {/* Confirmar eliminar */}
      {delId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-slate-900 mb-2">¿Eliminar registro?</h3>
            <p className="text-sm text-slate-500 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDelId(null)}
                className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                Cancelar
              </button>
              <button onClick={handleDelete}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
