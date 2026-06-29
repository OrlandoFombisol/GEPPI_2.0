import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  AlertOctagon, Plus, Pencil, Trash2, X,
  Upload, Download, CheckCircle2,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import * as XLSX from 'xlsx'
import { hallazgoDB, empresaDB } from '@/db'

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPOS = [
  { value: 'AT', label: 'AT — Accidente de Trabajo',       cls: 'text-red-700 bg-red-50 border-red-200',         short: 'AT' },
  { value: 'IT', label: 'IT — Incidente de Trabajo',        cls: 'text-orange-700 bg-orange-50 border-orange-200', short: 'IT' },
  { value: 'AC', label: 'AC — Acción Correctiva',           cls: 'text-blue-700 bg-blue-50 border-blue-200',       short: 'AC' },
  { value: 'AM', label: 'AM — Acción de Mejora',            cls: 'text-purple-700 bg-purple-50 border-purple-200', short: 'AM' },
  { value: 'AP', label: 'AP — Acción Preventiva',           cls: 'text-teal-700 bg-teal-50 border-teal-200',       short: 'AP' },
]

const ESTADOS = [
  { value: 'ABIERTO', label: 'Abierto', cls: 'text-orange-700 bg-orange-50 border-orange-200' },
  { value: 'CERRADO', label: 'Cerrado', cls: 'text-green-700 bg-green-50 border-green-200'    },
]

const colorPct = (p) => p >= 80 ? '#22c55e' : p >= 50 ? '#f59e0b' : '#ef4444'

const INP  = 'w-full h-9 px-3 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500'
const AREA = 'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none'
const SEL  = 'h-8 px-2.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500'

// Convierte número de serie Excel a YYYY-MM-DD
function excelDateToISO(val) {
  if (!val) return ''
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) return val.slice(0, 10)
  const n = typeof val === 'number' ? val : Number(val)
  if (!n || isNaN(n)) return ''
  const d = new Date(Math.round((n - 25569) * 86400000))
  return d.toISOString().slice(0, 10)
}

function normalizeEstado(raw) {
  const s = String(raw || '').toUpperCase().trim()
  if (s === 'CERRADO' || s === 'CERRADA') return 'CERRADO'
  return 'ABIERTO'
}

const EMPTY = {
  empresaId:        '',
  centroDeTrabajo:  '',
  area:             '',
  fechaEmision:     new Date().toISOString().slice(0, 10),
  descripcion:      '',
  correccion:       '',
  tipoAccion:       'AM',
  responsable:      '',
  fechaEjecucion:   '',
  estado:           'ABIERTO',
  observaciones:    '',
  fechaSeguimiento: '',
}

// ─── Modal crear/editar ───────────────────────────────────────────────────────

function HallazgoModal({ form, set, empresas, onClose, onSave, saving, errs }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">

        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {form.id ? 'Editar hallazgo' : 'Nuevo hallazgo / acción'}
            </h2>
            <p className="text-xs text-slate-400">MT-SST-013 · Acciones Preventivas, Correctivas y de Mejora</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Empresa + Tipo */}
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de acción *</label>
              <select value={form.tipoAccion}
                onChange={e => set(f => ({ ...f, tipoAccion: e.target.value }))}
                className={INP}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Centro de trabajo + Área */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Centro de Trabajo</label>
              <input value={form.centroDeTrabajo}
                onChange={e => set(f => ({ ...f, centroDeTrabajo: e.target.value }))}
                placeholder="Ej: GRANABASTOS, CÁRCELES…"
                className={INP}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Área</label>
              <input value={form.area}
                onChange={e => set(f => ({ ...f, area: e.target.value }))}
                placeholder="Ej: OPERATIVA, ADMINISTRATIVA…"
                className={INP}
              />
            </div>
          </div>

          {/* Fecha emisión + Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de emisión *</label>
              <input type="date" value={form.fechaEmision}
                onChange={e => set(f => ({ ...f, fechaEmision: e.target.value }))}
                className={`${INP} ${errs.fechaEmision ? 'border-red-400' : ''}`}
              />
              {errs.fechaEmision && <p className="text-xs text-red-500 mt-0.5">{errs.fechaEmision}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Estado</label>
              <select value={form.estado}
                onChange={e => set(f => ({ ...f, estado: e.target.value }))}
                className={INP}>
                {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Descripción de la No Conformidad / Hallazgo *
            </label>
            <textarea value={form.descripcion}
              onChange={e => set(f => ({ ...f, descripcion: e.target.value }))}
              rows={3}
              placeholder="Describa la no conformidad real o potencial, o la situación que genera la acción…"
              className={`${AREA} ${errs.descripcion ? 'border-red-400' : ''}`}
            />
            {errs.descripcion && <p className="text-xs text-red-500 mt-0.5">{errs.descripcion}</p>}
          </div>

          {/* Corrección */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Corrección / Acción *
            </label>
            <textarea value={form.correccion}
              onChange={e => set(f => ({ ...f, correccion: e.target.value }))}
              rows={3}
              placeholder="Describa la acción correctiva, preventiva o de mejora a ejecutar…"
              className={`${AREA} ${errs.correccion ? 'border-red-400' : ''}`}
            />
            {errs.correccion && <p className="text-xs text-red-500 mt-0.5">{errs.correccion}</p>}
          </div>

          {/* Responsable + Fecha ejecución */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Responsable de ejecución</label>
              <input value={form.responsable}
                onChange={e => set(f => ({ ...f, responsable: e.target.value }))}
                placeholder="Nombre del responsable"
                className={INP}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de ejecución</label>
              <input type="date" value={form.fechaEjecucion}
                onChange={e => set(f => ({ ...f, fechaEjecucion: e.target.value }))}
                className={INP}
              />
            </div>
          </div>

          {/* Observaciones + Fecha seguimiento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Observaciones</label>
              <textarea value={form.observaciones}
                onChange={e => set(f => ({ ...f, observaciones: e.target.value }))}
                rows={2}
                placeholder="Observaciones de seguimiento…"
                className={AREA}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha de seguimiento</label>
              <input type="date" value={form.fechaSeguimiento}
                onChange={e => set(f => ({ ...f, fechaSeguimiento: e.target.value }))}
                className={INP}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            Cancelar
          </button>
          <button onClick={onSave} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 rounded-lg transition-colors disabled:opacity-50">
            {saving ? 'Guardando…' : form.id ? 'Guardar cambios' : 'Registrar hallazgo'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal importar Excel ─────────────────────────────────────────────────────

function ImportModal({ empresas, onClose, onImport, importing }) {
  const [empresaId, setEmpresaId] = useState('')
  const [preview,   setPreview]   = useState([])
  const [fileName,  setFileName]  = useState('')
  const [parseErr,  setParseErr]  = useState('')
  const fileRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    setParseErr('')
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        // Fila 3 (índice 3) = encabezados, datos desde fila 4
        const dataRows = rows.slice(4).filter(r => r.some(c => c !== ''))
        const parsed = dataRows.map(r => ({
          centroDeTrabajo:  String(r[0] || ''),
          area:             String(r[1] || ''),
          fechaEmision:     excelDateToISO(r[2]),
          descripcion:      String(r[3] || ''),
          correccion:       String(r[4] || ''),
          tipoAccion:       String(r[5] || 'AM').toUpperCase(),
          responsable:      String(r[6] || ''),
          fechaEjecucion:   excelDateToISO(r[7]),
          estado:           normalizeEstado(r[8]),
          observaciones:    String(r[9] || ''),
          fechaSeguimiento: excelDateToISO(r[10]),
        }))
        setPreview(parsed)
      } catch (err) {
        setParseErr('No se pudo leer el archivo. Verifique que sea el formato MT-SST-013.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleImport = () => {
    if (!empresaId) return
    onImport(preview.map(r => ({ ...r, empresaId: Number(empresaId) })))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-base font-bold text-slate-900">Importar desde Excel</h2>
            <p className="text-xs text-slate-400">MT-SST-013 · Hoja "SEGUIMIENTO HALLAZGOS"</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">

          {/* Empresa destino */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Asignar todos los registros a la empresa *
            </label>
            <select value={empresaId} onChange={e => setEmpresaId(e.target.value)} className={INP}>
              <option value="">Seleccionar empresa…</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
            </select>
          </div>

          {/* Selector de archivo */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Archivo Excel (.xls / .xlsx)</label>
            <div className="flex items-center gap-3">
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                <Upload size={14} />
                {fileName || 'Seleccionar archivo'}
              </button>
              <input ref={fileRef} type="file" accept=".xls,.xlsx" onChange={handleFile} className="hidden" />
            </div>
            {parseErr && <p className="text-xs text-red-500 mt-1">{parseErr}</p>}
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">
                Vista previa: {preview.length} registros encontrados
              </p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      {['Centro de Trabajo', 'Tipo', 'Descripción', 'Estado'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-slate-500 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {preview.slice(0, 10).map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-slate-700">{r.centroDeTrabajo}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold border ${TIPOS.find(t => t.value === r.tipoAccion)?.cls || ''}`}>
                            {r.tipoAccion}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600 max-w-[200px] truncate">{r.descripcion}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border ${ESTADOS.find(e => e.value === r.estado)?.cls || ''}`}>
                            {r.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {preview.length > 10 && (
                      <tr><td colSpan={4} className="px-3 py-2 text-slate-400 text-center">
                        …y {preview.length - 10} registros más
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!empresaId || preview.length === 0 || importing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 rounded-lg transition-colors disabled:opacity-50">
            <Upload size={14} />
            {importing ? 'Importando…' : `Importar ${preview.length} registros`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Page() {
  const [hallazgos,  setHallazgos]  = useState([])
  const [empresas,   setEmpresas]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState({ open: false, form: { ...EMPTY } })
  const [importModal,setImportModal]= useState(false)
  const [delId,      setDelId]      = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [importing,  setImporting]  = useState(false)
  const [errs,       setErrs]       = useState({})
  const [importMsg,  setImportMsg]  = useState(null)

  const [filtroEmpresa, setFiltroEmpresa] = useState('TODOS')
  const [filtroTipo,    setFiltroTipo]    = useState('TODOS')
  const [filtroEstado,  setFiltroEstado]  = useState('TODOS')
  const [filtroAnio,    setFiltroAnio]    = useState('TODOS')

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [h, e] = await Promise.all([hallazgoDB.getAll(), empresaDB.getAll()])
      setHallazgos(h || [])
      setEmpresas(e  || [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const empresaMap = useMemo(
    () => Object.fromEntries(empresas.map(e => [e.id, e.razonSocial])),
    [empresas]
  )

  // Cumplimiento por empresa: cerradas / total * 100
  const cumplimientoEmpresas = useMemo(() => {
    const m = {}
    hallazgos.forEach(h => {
      const n = empresaMap[h.empresaId] || `Empresa #${h.empresaId}`
      if (!m[h.empresaId]) m[h.empresaId] = { nombre: n, total: 0, cerradas: 0 }
      m[h.empresaId].total++
      if (h.estado === 'CERRADO') m[h.empresaId].cerradas++
    })
    return Object.entries(m)
      .map(([id, d]) => ({
        id: Number(id),
        nombre: d.nombre.length > 20 ? d.nombre.slice(0, 18) + '…' : d.nombre,
        nombreFull: d.nombre,
        total: d.total,
        cerradas: d.cerradas,
        pct: d.total > 0 ? Math.round(d.cerradas / d.total * 100) : 0,
      }))
      .sort((a, b) => b.pct - a.pct)
  }, [hallazgos, empresaMap])

  const anios = useMemo(() => {
    const s = new Set(hallazgos.map(h => h.fechaEmision?.slice(0, 4)).filter(Boolean))
    return [...s].sort().reverse()
  }, [hallazgos])

  const filtrados = useMemo(() => {
    let r = hallazgos
    if (filtroEmpresa !== 'TODOS') r = r.filter(h => String(h.empresaId) === filtroEmpresa)
    if (filtroTipo    !== 'TODOS') r = r.filter(h => h.tipoAccion === filtroTipo)
    if (filtroEstado  !== 'TODOS') r = r.filter(h => h.estado === filtroEstado)
    if (filtroAnio    !== 'TODOS') r = r.filter(h => h.fechaEmision?.startsWith(filtroAnio))
    return [...r].sort((a, b) => (b.fechaEmision || '').localeCompare(a.fechaEmision || ''))
  }, [hallazgos, filtroEmpresa, filtroTipo, filtroEstado, filtroAnio])

  const totalCerradas = hallazgos.filter(h => h.estado === 'CERRADO').length
  const pctGlobal     = hallazgos.length > 0 ? Math.round(totalCerradas / hallazgos.length * 100) : 0

  const validate = (f) => {
    const e = {}
    if (!f.empresaId)           e.empresaId   = 'Seleccione una empresa'
    if (!f.fechaEmision)        e.fechaEmision = 'Ingrese la fecha'
    if (!f.descripcion?.trim()) e.descripcion  = 'Ingrese la descripción'
    if (!f.correccion?.trim())  e.correccion   = 'Ingrese la corrección / acción'
    return e
  }

  const handleSave = async () => {
    const e = validate(modal.form)
    if (Object.keys(e).length) { setErrs(e); return }
    setSaving(true)
    try {
      const { id, ...data } = modal.form
      if (id) await hallazgoDB.update(id, data)
      else    await hallazgoDB.create(data)
      await cargar()
      setModal({ open: false, form: { ...EMPTY } })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    await hallazgoDB.remove(delId)
    setHallazgos(p => p.filter(h => h.id !== delId))
    setDelId(null)
  }

  const handleImport = async (items) => {
    setImporting(true)
    try {
      await hallazgoDB.bulkCreate(items)
      await cargar()
      setImportModal(false)
      setImportMsg(`${items.length} registros importados correctamente.`)
      setTimeout(() => setImportMsg(null), 4000)
    } finally { setImporting(false) }
  }

  const exportarExcel = () => {
    // Cabecera igual al formato MT-SST-013
    const encabezado = [
      ['', '', 'SISTEMA DE GESTION DE SEGURIDAD Y SALUD EN EL TRABAJO', '', '', '', '', '', '', '', '', 'Código: MT-SST-013'],
      ['', '', 'CORPORACION PARA EL FOMENTO DEL BIENESTAR SOCIAL', '', '', '', '', '', '', '', '', 'Versión 002'],
      ['', '', 'MATRIZ DE ACCIONES PREVENTIVAS, CORRECTIVAS Y DE MEJORA', '', '', '', '', '', '', '', '', `Fecha vigencia: ${new Date().toLocaleDateString('es-CO')}`],
      ['CENTRO DE TRABAJO', 'ÁREA', 'FECHA DE EMISIÓN', 'DESCRIPCIÓN DE LA NO CONFORMIDAD REAL O POTENCIAL O SITUACIÓN O ESCENARIO QUE LLEVA A ACCIÓN DE MEJORA', 'CORRECCIÓN', 'TIPO DE ACCION', 'RESPONSABLE EJECUCIÓN', 'FECHA DE EJECUCIÓN PARA ACAPAM', 'ESTADO', 'OBSERVACIONES', 'FECHA DE SEGUIMIENTO', 'INDICADOR P', 'E', '% CUMPLIMIENTO'],
    ]
    const filas = filtrados.map(h => [
      h.centroDeTrabajo || '',
      h.area || '',
      h.fechaEmision || '',
      h.descripcion || '',
      h.correccion || '',
      h.tipoAccion || '',
      h.responsable || '',
      h.fechaEjecucion || '',
      h.estado || '',
      h.observaciones || '',
      h.fechaSeguimiento || '',
      1,
      h.estado === 'CERRADO' ? 1 : '',
      h.estado === 'CERRADO' ? '100%' : '0%',
    ])
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([...encabezado, ...filas])
    ws['!cols'] = [22, 14, 14, 50, 50, 10, 22, 14, 10, 30, 14, 6, 6, 12].map(w => ({ wch: w }))
    XLSX.utils.book_append_sheet(wb, ws, 'SEGUIMIENTO HALLAZGOS')
    XLSX.writeFile(wb, `MT-SST-013_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const abrirNuevo  = () => { setErrs({}); setModal({ open: true, form: { ...EMPTY } }) }
  const abrirEditar = (h) => { setErrs({}); setModal({ open: true, form: { ...h } }) }
  const hayFiltros  = filtroEmpresa !== 'TODOS' || filtroTipo !== 'TODOS' || filtroEstado !== 'TODOS' || filtroAnio !== 'TODOS'

  return (
    <div className="p-3 sm:p-6 space-y-5">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertOctagon size={22} className="text-red-600" strokeWidth={1.8} />
            AT / IT — Acciones Preventivas, Correctivas y de Mejora
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            MT-SST-013 · Indicador: acciones cerradas / total × 100
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setImportModal(true)}
            className="flex items-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-xl transition-colors">
            <Upload size={14} />
            Importar Excel
          </button>
          <button onClick={exportarExcel}
            className="flex items-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-xl transition-colors">
            <Download size={14} />
            Exportar
          </button>
          <button onClick={abrirNuevo}
            className="flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
            <Plus size={15} />
            Nuevo hallazgo
          </button>
        </div>
      </div>

      {/* Mensaje importación */}
      {importMsg && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
          <CheckCircle2 size={15} />
          {importMsg}
        </div>
      )}

      {/* Stats globales */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total hallazgos',  value: hallazgos.length,                                           cls: 'text-slate-800', bg: 'bg-slate-50' },
          { label: 'AT',               value: hallazgos.filter(h => h.tipoAccion === 'AT').length,        cls: 'text-red-700', bg: 'bg-red-50' },
          { label: 'IT',               value: hallazgos.filter(h => h.tipoAccion === 'IT').length,        cls: 'text-orange-700', bg: 'bg-orange-50' },
          { label: 'Cerradas',         value: totalCerradas,                                              cls: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Cumplimiento gral',value: `${pctGlobal}%`,
            cls: pctGlobal >= 80 ? 'text-green-700' : pctGlobal >= 50 ? 'text-yellow-700' : 'text-red-700',
            bg: 'bg-white' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl border border-slate-100 p-3`}>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Indicadores por empresa */}
      {cumplimientoEmpresas.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Cumplimiento por empresa
            </h2>
            {cumplimientoEmpresas.map(e => (
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
                  <span>{e.cerradas} cerradas de {e.total}</span>
                  <span>{e.total - e.cerradas} abiertas</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">
              % Cumplimiento por empresa
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cumplimientoEmpresas} margin={{ top: 4, right: 8, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="nombre" tick={{ fontSize: 9, fill: '#64748b' }}
                  angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]}
                  tickFormatter={v => `${v}%`} />
                <Tooltip
                  formatter={(v, _n, p) => [`${v}% (${p.payload.cerradas}/${p.payload.total})`, 'Cumplimiento']}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  labelFormatter={(l, p) => p[0]?.payload?.nombreFull || l}
                />
                <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                  {cumplimientoEmpresas.map(e => <Cell key={e.id} fill={colorPct(e.pct)} />)}
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
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.short} — {t.label.split('—')[1]?.trim()}</option>)}
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className={SEL}>
          <option value="TODOS">Todos los estados</option>
          {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        {anios.length > 0 && (
          <select value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)} className={SEL}>
            <option value="TODOS">Todos los años</option>
            {anios.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
        {hayFiltros && (
          <button onClick={() => { setFiltroEmpresa('TODOS'); setFiltroTipo('TODOS'); setFiltroEstado('TODOS'); setFiltroAnio('TODOS') }}
            className="text-xs text-primary-600 hover:text-primary-800 font-medium">
            Limpiar filtros
          </button>
        )}
        <span className="ml-auto text-xs text-slate-400">{filtrados.length} registros</span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {[
                  'Centro de Trabajo', 'Área', 'F. Emisión',
                  'Descripción No Conformidad / Hallazgo',
                  'Corrección / Acción',
                  'Tipo', 'Responsable Ejecución', 'F. Ejec. ACAPAM',
                  'Estado', 'Observaciones', 'F. Seguimiento',
                  'P', 'E', '% Cumplimiento', '',
                ].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={14} className="px-4 py-3">
                    <div className="h-5 bg-slate-100 rounded animate-pulse" />
                  </td></tr>
                ))
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={14} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                      <AlertOctagon size={22} className="text-red-500" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm text-slate-500">
                      {hayFiltros
                        ? 'Sin resultados con los filtros aplicados.'
                        : 'No hay registros. Crea uno con "Nuevo hallazgo" o importa desde Excel.'}
                    </p>
                  </div>
                </td></tr>
              ) : filtrados.map(h => {
                const tipoInfo   = TIPOS.find(t => t.value === h.tipoAccion)
                const estadoInfo = ESTADOS.find(e => e.value === h.estado)
                const e_val      = h.estado === 'CERRADO' ? 1 : 0

                return (
                  <tr key={h.id} className={`hover:bg-slate-50 transition-colors ${h.estado === 'CERRADO' ? 'opacity-75' : ''}`}>
                    {/* 1. Centro de Trabajo */}
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-700 font-medium">{h.centroDeTrabajo || '—'}</td>
                    {/* 2. Área */}
                    <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{h.area || '—'}</td>
                    {/* 3. Fecha Emisión */}
                    <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap font-mono">{h.fechaEmision || '—'}</td>
                    {/* 4. Descripción */}
                    <td className="px-3 py-2.5 max-w-[220px]">
                      <p className="text-slate-700 line-clamp-2 text-xs" title={h.descripcion}>{h.descripcion}</p>
                    </td>
                    {/* 5. Corrección */}
                    <td className="px-3 py-2.5 max-w-[200px]">
                      <p className={`line-clamp-2 text-xs ${h.estado === 'CERRADO' ? 'text-slate-400 line-through' : 'text-slate-600'}`} title={h.correccion}>
                        {h.correccion}
                      </p>
                    </td>
                    {/* 6. Tipo de Acción */}
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex px-1.5 py-0.5 rounded font-bold border ${tipoInfo?.cls}`}>
                        {h.tipoAccion}
                      </span>
                    </td>
                    {/* 7. Responsable */}
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{h.responsable || '—'}</td>
                    {/* 8. Fecha Ejecución ACAPAM */}
                    <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap font-mono">{h.fechaEjecucion || '—'}</td>
                    {/* 9. Estado — clickeable para abrir/cerrar */}
                    <td className="px-3 py-2.5">
                      <button
                        onClick={async () => {
                          const nuevoEstado = h.estado === 'CERRADO' ? 'ABIERTO' : 'CERRADO'
                          await hallazgoDB.update(h.id, { estado: nuevoEstado })
                          setHallazgos(p => p.map(x => x.id === h.id ? { ...x, estado: nuevoEstado } : x))
                        }}
                        className={`inline-flex px-2 py-0.5 rounded-md font-semibold border transition-colors cursor-pointer hover:opacity-80 ${estadoInfo?.cls}`}>
                        {estadoInfo?.label}
                      </button>
                    </td>
                    {/* 10. Observaciones */}
                    <td className="px-3 py-2.5 max-w-[160px]">
                      {h.observaciones
                        ? <p className="text-xs text-slate-500 line-clamp-2" title={h.observaciones}>{h.observaciones}</p>
                        : <span className="text-slate-300">—</span>
                      }
                    </td>
                    {/* 11. Fecha Seguimiento */}
                    <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap font-mono">{h.fechaSeguimiento || '—'}</td>
                    {/* 12. P */}
                    <td className="px-3 py-2.5 text-center font-bold font-mono">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-orange-100 text-orange-700 text-xs font-bold">1</span>
                    </td>
                    {/* 13. E */}
                    <td className="px-3 py-2.5 text-center font-bold font-mono">
                      {e_val
                        ? <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-100 text-green-700 text-xs font-bold">1</span>
                        : <span className="text-slate-300">—</span>
                      }
                    </td>
                    {/* 14. % Cumplimiento */}
                    <td className="px-3 py-2.5 text-center font-bold">
                      <span className={`text-sm ${e_val ? 'text-green-600' : 'text-red-400'}`}>{e_val ? '100%' : '0%'}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => abrirEditar(h)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors" title="Editar">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => setDelId(h.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>

            {/* Fila totales */}
            {filtrados.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
                  <td colSpan={11} className="px-3 py-2.5 text-xs text-slate-500 text-right">
                    TOTALES ({filtrados.length} registros)
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold text-slate-700 font-mono">
                    {filtrados.length}
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold text-green-700 font-mono">
                    {filtrados.filter(h => h.estado === 'CERRADO').length}
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold">
                    <span className={(() => {
                      const p = filtrados.length > 0 ? Math.round(filtrados.filter(h => h.estado === 'CERRADO').length / filtrados.length * 100) : 0
                      return p >= 80 ? 'text-green-600' : p >= 50 ? 'text-yellow-600' : 'text-red-600'
                    })()}>
                      {filtrados.length > 0 ? Math.round(filtrados.filter(h => h.estado === 'CERRADO').length / filtrados.length * 100) : 0}%
                    </span>
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal crear/editar */}
      {modal.open && (
        <HallazgoModal
          form={modal.form}
          set={(fn) => setModal(m => ({ ...m, form: fn(m.form) }))}
          empresas={empresas}
          onClose={() => setModal({ open: false, form: { ...EMPTY } })}
          onSave={handleSave}
          saving={saving}
          errs={errs}
        />
      )}

      {/* Modal importar */}
      {importModal && (
        <ImportModal
          empresas={empresas}
          onClose={() => setImportModal(false)}
          onImport={handleImport}
          importing={importing}
        />
      )}

      {/* Confirmar eliminar */}
      {delId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-slate-900 mb-2">¿Eliminar hallazgo?</h3>
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
