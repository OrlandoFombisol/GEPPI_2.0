import { useState, useEffect, useMemo, useCallback } from 'react'
import { Stethoscope, Plus, Pencil, Trash2, X, Save, Settings2 } from 'lucide-react'
import { examenMedicoDB, configuracionAlertaDB, trabajadorDB, empresaDB } from '@/db'

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPOS_EXAMEN = [
  { value: 'INGRESO',     label: 'Ingreso'              },
  { value: 'PERIODICO',   label: 'Periódico'             },
  { value: 'RETIRO',      label: 'Retiro'                },
  { value: 'RESTRICCION', label: 'Restricción médica'    },
]

const APTITUDES = [
  { value: 'APTO',                  label: 'Apto',                    cls: 'text-green-700 bg-green-50 border-green-200'   },
  { value: 'APTO_CON_RESTRICCIONES',label: 'Apto con restricciones',  cls: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  { value: 'NO_APTO',               label: 'No apto',                 cls: 'text-red-700 bg-red-50 border-red-200'          },
]

const ESTADO_EXAMEN = {
  VIGENTE:          { label: 'Vigente',           cls: 'text-green-700 bg-green-50 border-green-200'  },
  PROXIMO_A_VENCER: { label: 'Próximo a vencer',  cls: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  VENCIDO:          { label: 'Vencido',           cls: 'text-red-700 bg-red-50 border-red-200'         },
  SIN_VENCIMIENTO:  { label: 'Sin vencimiento',   cls: 'text-slate-500 bg-slate-50 border-slate-200'   },
}

const DEFAULT_CONFIG = { diasAnticipacion: 30, activa: true, observacion: '' }

const EMPTY_FORM = {
  trabajadorId: '',
  empresaId: '',
  tipo: 'INGRESO',
  fechaExamen: new Date().toISOString().slice(0, 10),
  fechaVencimiento: '',
  aptitudLaboral: 'APTO',
  restricciones: '',
  medico: '',
  observaciones: '',
}

const INP = 'w-full h-9 px-3 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500'
const SEL = 'h-8 px-2.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcEstado(exam, configMap) {
  if (!exam.fechaVencimiento) return 'SIN_VENCIMIENTO'
  const hoy  = new Date(); hoy.setHours(0, 0, 0, 0)
  const venc = new Date(exam.fechaVencimiento + 'T00:00:00')
  if (venc < hoy) return 'VENCIDO'
  const dias = configMap[exam.tipo]?.diasAnticipacion ?? 30
  const lim  = new Date(hoy); lim.setDate(lim.getDate() + dias)
  if (venc <= lim) return 'PROXIMO_A_VENCER'
  return 'VIGENTE'
}

function diasRestantes(fechaVenc) {
  if (!fechaVenc) return null
  const hoy  = new Date(); hoy.setHours(0, 0, 0, 0)
  const venc = new Date(fechaVenc + 'T00:00:00')
  return Math.round((venc - hoy) / 86400000)
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ExamenModal({ form, set, trabajadores, empresas, onClose, onSave, saving, errs }) {
  const trabajadorSeleccionado = trabajadores.find(t => t.id === Number(form.trabajadorId))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">

        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-base font-bold text-slate-900">
            {form.id ? 'Editar examen médico' : 'Registrar examen médico'}
          </h2>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5 space-y-4">

          {/* Trabajador */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Trabajador *</label>
            <select value={form.trabajadorId}
              onChange={e => {
                const t = trabajadores.find(x => x.id === Number(e.target.value))
                set(f => ({ ...f, trabajadorId: Number(e.target.value), empresaId: t?.empresaId || f.empresaId }))
              }}
              className={`${INP} ${errs.trabajadorId ? 'border-red-400' : ''}`}>
              <option value="">Seleccionar trabajador…</option>
              {trabajadores.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nombres} {t.apellidos} — {t.cedula}
                </option>
              ))}
            </select>
            {errs.trabajadorId && <p className="text-xs text-red-500 mt-0.5">{errs.trabajadorId}</p>}
            {trabajadorSeleccionado && (
              <p className="text-xs text-slate-400 mt-1">
                Cargo: {trabajadorSeleccionado.cargoNombre || '—'} ·
                Empresa: {empresas.find(e => e.id === trabajadorSeleccionado.empresaId)?.razonSocial || '—'}
              </p>
            )}
          </div>

          {/* Tipo + Aptitud */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de examen *</label>
              <select value={form.tipo}
                onChange={e => set(f => ({ ...f, tipo: e.target.value }))}
                className={INP}>
                {TIPOS_EXAMEN.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Aptitud laboral *</label>
              <select value={form.aptitudLaboral}
                onChange={e => set(f => ({ ...f, aptitudLaboral: e.target.value }))}
                className={INP}>
                {APTITUDES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha del examen *</label>
              <input type="date" value={form.fechaExamen}
                onChange={e => set(f => ({ ...f, fechaExamen: e.target.value }))}
                className={`${INP} ${errs.fechaExamen ? 'border-red-400' : ''}`}
              />
              {errs.fechaExamen && <p className="text-xs text-red-500 mt-0.5">{errs.fechaExamen}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Fecha de vencimiento
                {form.tipo === 'RETIRO' && <span className="text-slate-400 ml-1">(opcional)</span>}
              </label>
              <input type="date" value={form.fechaVencimiento}
                onChange={e => set(f => ({ ...f, fechaVencimiento: e.target.value }))}
                className={INP}
              />
            </div>
          </div>

          {/* Restricciones — solo si hay limitación */}
          {(form.aptitudLaboral === 'APTO_CON_RESTRICCIONES' || form.aptitudLaboral === 'NO_APTO') && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Restricciones / Limitaciones *</label>
              <textarea value={form.restricciones}
                onChange={e => set(f => ({ ...f, restricciones: e.target.value }))}
                rows={3}
                placeholder="Describa las restricciones o limitaciones médicas…"
                className={`w-full px-3 py-2 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none ${errs.restricciones ? 'border-red-400' : 'border-slate-300'}`}
              />
              {errs.restricciones && <p className="text-xs text-red-500 mt-0.5">{errs.restricciones}</p>}
            </div>
          )}

          {/* Médico */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del médico</label>
            <input value={form.medico}
              onChange={e => set(f => ({ ...f, medico: e.target.value }))}
              placeholder="Dr. / Dra. nombre completo"
              className={INP}
            />
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
            {saving ? 'Guardando…' : form.id ? 'Guardar cambios' : 'Registrar examen'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Panel de configuración de alertas ───────────────────────────────────────

function ConfigPanel({ configs, onSave, saving }) {
  const [local, setLocal] = useState(() => {
    const m = {}
    TIPOS_EXAMEN.forEach(t => {
      const c = configs.find(x => x.tipo === t.value)
      m[t.value] = c
        ? { diasAnticipacion: c.diasAnticipacion ?? 30, activa: c.activa ?? true, observacion: c.observacion ?? '' }
        : { ...DEFAULT_CONFIG }
    })
    return m
  })

  useEffect(() => {
    const m = {}
    TIPOS_EXAMEN.forEach(t => {
      const c = configs.find(x => x.tipo === t.value)
      m[t.value] = c
        ? { diasAnticipacion: c.diasAnticipacion ?? 30, activa: c.activa ?? true, observacion: c.observacion ?? '' }
        : { ...DEFAULT_CONFIG }
    })
    setLocal(m)
  }, [configs])

  const update = (tipo, field, val) =>
    setLocal(p => ({ ...p, [tipo]: { ...p[tipo], [field]: val } }))

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 size={16} className="text-primary-700" strokeWidth={2} />
        <h2 className="text-sm font-bold text-slate-800">Configuración de alertas de exámenes médicos</h2>
      </div>
      <p className="text-xs text-slate-500 mb-5">
        Define cuántos días antes del vencimiento se genera la alerta y el mensaje personalizado que aparece en el centro de alertas.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TIPOS_EXAMEN.map(t => {
          const cfg = local[t.value] || { ...DEFAULT_CONFIG }
          return (
            <div key={t.value}
              className={`rounded-xl border p-4 transition-colors ${cfg.activa ? 'border-primary-200 bg-primary-50/30' : 'border-slate-200 bg-slate-50 opacity-70'}`}>

              {/* Encabezado con toggle */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-800">{t.label}</span>
                <button
                  onClick={() => update(t.value, 'activa', !cfg.activa)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${cfg.activa ? 'bg-primary-600' : 'bg-slate-300'}`}>
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${cfg.activa ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Días de anticipación */}
              <div className="mb-3">
                <label className="block text-xs text-slate-500 mb-1">Días de anticipación</label>
                <div className="flex items-center gap-2">
                  <input type="number" min={1} max={365} value={cfg.diasAnticipacion}
                    onChange={e => update(t.value, 'diasAnticipacion', Number(e.target.value))}
                    className="w-20 h-8 px-2 rounded-lg border border-slate-300 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-xs text-slate-400">días antes del vencimiento</span>
                </div>
              </div>

              {/* Observación de alerta */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Observación de alerta</label>
                <textarea value={cfg.observacion}
                  onChange={e => update(t.value, 'observacion', e.target.value)}
                  rows={2}
                  placeholder={`Ej: Programar examen de ${t.label.toLowerCase()} con la EPS…`}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end mt-5">
        <button onClick={() => onSave(local)} disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
          <Save size={14} />
          {saving ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Page() {
  const [examenes,      setExamenes]      = useState([])
  const [trabajadores,  setTrabajadores]  = useState([])
  const [empresas,      setEmpresas]      = useState([])
  const [configs,       setConfigs]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [activeTab,     setActiveTab]     = useState('TODOS')
  const [modal,         setModal]         = useState({ open: false, form: { ...EMPTY_FORM } })
  const [delId,         setDelId]         = useState(null)
  const [saving,        setSaving]        = useState(false)
  const [savingCfg,     setSavingCfg]     = useState(false)
  const [errs,          setErrs]          = useState({})

  const [filtroEmpresa, setFiltroEmpresa] = useState('TODOS')
  const [filtroAptitud, setFiltroAptitud] = useState('TODOS')

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [ex, tr, em, cf] = await Promise.all([
        examenMedicoDB.getAll(),
        trabajadorDB.getAll(),
        empresaDB.getAll(),
        configuracionAlertaDB.getAll(),
      ])
      setExamenes(ex  || [])
      setTrabajadores(tr || [])
      setEmpresas(em  || [])
      setConfigs(cf   || [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const configMap = useMemo(
    () => Object.fromEntries(configs.map(c => [c.tipo, c])),
    [configs]
  )
  const trabajadorMap = useMemo(
    () => Object.fromEntries(trabajadores.map(t => [t.id, t])),
    [trabajadores]
  )
  const empresaMap = useMemo(
    () => Object.fromEntries(empresas.map(e => [e.id, e.razonSocial])),
    [empresas]
  )

  const examenesConEstado = useMemo(
    () => examenes.map(ex => ({ ...ex, _estado: calcEstado(ex, configMap) })),
    [examenes, configMap]
  )

  const filtrados = useMemo(() => {
    let r = examenesConEstado
    if (activeTab      !== 'TODOS') r = r.filter(e => e.tipo      === activeTab)
    if (filtroEmpresa  !== 'TODOS') r = r.filter(e => String(e.empresaId) === filtroEmpresa)
    if (filtroAptitud  !== 'TODOS') r = r.filter(e => e.aptitudLaboral === filtroAptitud)
    return [...r].sort((a, b) => (a.fechaVencimiento || '').localeCompare(b.fechaVencimiento || ''))
  }, [examenesConEstado, activeTab, filtroEmpresa, filtroAptitud])

  const stats = useMemo(() => {
    const base = activeTab !== 'TODOS' ? examenesConEstado.filter(e => e.tipo === activeTab) : examenesConEstado
    return {
      total:          base.length,
      vigentes:       base.filter(e => e._estado === 'VIGENTE').length,
      proximos:       base.filter(e => e._estado === 'PROXIMO_A_VENCER').length,
      vencidos:       base.filter(e => e._estado === 'VENCIDO').length,
      sinVencimiento: base.filter(e => e._estado === 'SIN_VENCIMIENTO').length,
    }
  }, [examenesConEstado, activeTab])

  const validate = (f) => {
    const e = {}
    if (!f.trabajadorId)   e.trabajadorId = 'Seleccione un trabajador'
    if (!f.fechaExamen)    e.fechaExamen  = 'Ingrese la fecha del examen'
    if ((f.aptitudLaboral === 'APTO_CON_RESTRICCIONES' || f.aptitudLaboral === 'NO_APTO') && !f.restricciones?.trim())
      e.restricciones = 'Describa las restricciones'
    return e
  }

  const handleSave = async () => {
    const e = validate(modal.form)
    if (Object.keys(e).length) { setErrs(e); return }
    setSaving(true)
    try {
      const { id, _estado, ...data } = modal.form
      // Auto-asignar empresaId desde el trabajador si no fue seteado
      if (!data.empresaId && data.trabajadorId) {
        const t = trabajadorMap[data.trabajadorId]
        data.empresaId = t?.empresaId || null
      }
      if (id) await examenMedicoDB.update(id, data)
      else    await examenMedicoDB.create(data)
      await cargar()
      setModal({ open: false, form: { ...EMPTY_FORM } })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    await examenMedicoDB.remove(delId)
    setExamenes(p => p.filter(e => e.id !== delId))
    setDelId(null)
  }

  const handleSaveConfig = async (local) => {
    setSavingCfg(true)
    try {
      await Promise.all(
        Object.entries(local).map(([tipo, data]) => configuracionAlertaDB.upsert(tipo, data))
      )
      const cf = await configuracionAlertaDB.getAll()
      setConfigs(cf || [])
    } finally { setSavingCfg(false) }
  }

  const abrirNueva  = () => { setErrs({}); setModal({ open: true, form: { ...EMPTY_FORM } }) }
  const abrirEditar = (ex) => {
    const { _estado, ...rest } = ex
    setErrs({})
    setModal({ open: true, form: { ...rest } })
  }

  const TABS = [{ value: 'TODOS', label: 'Todos' }, ...TIPOS_EXAMEN]

  return (
    <div className="p-3 sm:p-6 space-y-5">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope size={22} className="text-teal-600" strokeWidth={1.8} />
            Exámenes Médicos Ocupacionales
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ingreso · Periódicos · Retiro · Restricciones médicas
          </p>
        </div>
        <button onClick={abrirNueva}
          className="flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
          <Plus size={15} />
          Registrar examen
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total',               value: stats.total,          cls: 'text-slate-800', bg: 'bg-slate-50' },
          { label: 'Vigentes',            value: stats.vigentes,       cls: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Próx. a vencer',      value: stats.proximos,       cls: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: 'Vencidos',            value: stats.vencidos,       cls: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Sin vencimiento',     value: stats.sinVencimiento, cls: 'text-slate-500', bg: 'bg-white' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl border border-slate-100 p-3`}>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 flex-wrap">
        {TABS.map(tab => (
          <button key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
              activeTab === tab.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800',
            ].join(' ')}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)} className={SEL}>
          <option value="TODOS">Todas las empresas</option>
          {empresas.map(e => <option key={e.id} value={String(e.id)}>{e.razonSocial}</option>)}
        </select>
        <select value={filtroAptitud} onChange={e => setFiltroAptitud(e.target.value)} className={SEL}>
          <option value="TODOS">Todas las aptitudes</option>
          {APTITUDES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
        {(filtroEmpresa !== 'TODOS' || filtroAptitud !== 'TODOS') && (
          <button onClick={() => { setFiltroEmpresa('TODOS'); setFiltroAptitud('TODOS') }}
            className="text-xs text-primary-600 hover:text-primary-800 font-medium">
            Limpiar filtros
          </button>
        )}
        <span className="ml-auto text-xs text-slate-400">{filtrados.length} registros</span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Trabajador', 'Empresa', 'Tipo', 'F. Examen', 'F. Vencimiento', 'Aptitud', 'Estado', 'Restricciones', ''].map(h => (
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
                    <td colSpan={9} className="px-4 py-3">
                      <div className="h-5 bg-slate-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center">
                        <Stethoscope size={22} className="text-teal-500" strokeWidth={1.5} />
                      </div>
                      <p className="text-sm text-slate-500">
                        No hay exámenes registrados. Registra el primero con el botón superior.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filtrados.map(ex => {
                const t       = trabajadorMap[ex.trabajadorId]
                const nombre  = t ? `${t.nombres} ${t.apellidos}` : `Trabajador #${ex.trabajadorId}`
                const cedula  = t?.cedula || '—'
                const empresa = empresaMap[ex.empresaId] || '—'
                const apt     = APTITUDES.find(a => a.value === ex.aptitudLaboral)
                const est     = ESTADO_EXAMEN[ex._estado] || ESTADO_EXAMEN.SIN_VENCIMIENTO
                const dias    = diasRestantes(ex.fechaVencimiento)
                const tipoLabel = TIPOS_EXAMEN.find(x => x.value === ex.tipo)?.label || ex.tipo

                return (
                  <tr key={ex.id} className={`hover:bg-slate-50 transition-colors ${ex._estado === 'VENCIDO' ? 'bg-red-50/40' : ex._estado === 'PROXIMO_A_VENCER' ? 'bg-yellow-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900 whitespace-nowrap">{nombre}</p>
                      <p className="text-xs text-slate-400">{cedula}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[120px] truncate whitespace-nowrap">{empresa}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{tipoLabel}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{ex.fechaExamen || '—'}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {ex.fechaVencimiento
                        ? <span className={dias !== null && dias <= 0 ? 'text-red-600 font-semibold' : dias !== null && dias <= 30 ? 'text-yellow-600 font-semibold' : 'text-slate-500'}>
                            {ex.fechaVencimiento}
                            {dias !== null && (
                              <span className="block text-[10px] leading-none mt-0.5">
                                {dias < 0 ? `Vencido hace ${Math.abs(dias)} días` : dias === 0 ? 'Vence hoy' : `${dias} días`}
                              </span>
                            )}
                          </span>
                        : <span className="text-slate-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${apt?.cls || ''}`}>
                        {apt?.label || ex.aptitudLaboral}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${est.cls}`}>
                        {est.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[140px]">
                      {ex.restricciones
                        ? <p className="text-xs text-slate-500 truncate" title={ex.restricciones}>{ex.restricciones}</p>
                        : <span className="text-xs text-slate-300">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => abrirEditar(ex)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Editar">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => setDelId(ex.id)}
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

      {/* Configuración de alertas */}
      <ConfigPanel configs={configs} onSave={handleSaveConfig} saving={savingCfg} />

      {/* Modal crear/editar */}
      {modal.open && (
        <ExamenModal
          form={modal.form}
          set={(fn) => setModal(m => ({ ...m, form: fn(m.form) }))}
          trabajadores={trabajadores}
          empresas={empresas}
          onClose={() => setModal({ open: false, form: { ...EMPTY_FORM } })}
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
            <h3 className="text-base font-bold text-slate-900 mb-2">¿Eliminar examen?</h3>
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
