import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { ShieldCheck, Plus, Download, ChevronDown, ChevronRight, Info } from 'lucide-react'
import * as XLSX from 'xlsx'
import { evaluacionSGSSTDB, itemEvaluacionDB, empresaDB } from '@/db'
import {
  ITEMS_0312, ESTANDARES, PHVA_COLOR, ESTADO_INFO, calcPuntaje,
} from './items'

// ─── Constantes ───────────────────────────────────────────────────────────────

const AÑO_BASE = new Date().getFullYear()
const AÑOS     = [AÑO_BASE - 2, AÑO_BASE - 1, AÑO_BASE, AÑO_BASE + 1]

const OPCIONES_ESTADO = [
  { value: '',                   label: '— Sin evaluar —' },
  { value: 'CUMPLE_TOTALMENTE',  label: 'Cumple totalmente'   },
  { value: 'CUMPLE_PARCIALMENTE',label: 'Cumple parcialmente' },
  { value: 'NO_CUMPLE',          label: 'No cumple'           },
  { value: 'NO_APLICA',          label: 'No aplica'           },
  { value: 'EN_REVISION',        label: 'En revisión'         },
]

// Nivel de calificación según Res. 0312
function nivelCalificacion(total) {
  if (total >= 86) return { label: 'ACEPTABLE',                color: '#16a34a', bg: '#f0fdf4', border: '#86efac' }
  if (total >= 61) return { label: 'MODERADAMENTE ACEPTABLE',  color: '#d97706', bg: '#fffbeb', border: '#fcd34d' }
  return             { label: 'CRÍTICO',                       color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' }
}

// ─── Fila del checklist ───────────────────────────────────────────────────────

function FilaItem({ item, dato, onChange, debounceMs = 400 }) {
  const [localResponsable,  setLocalR] = useState(dato?.responsable         || '')
  const [localFecha,        setLocalF] = useState(dato?.fechaVerificacion   || '')
  const [localObs,          setLocalO] = useState(dato?.observaciones       || '')
  const timerR = useRef(); const timerO = useRef()
  const [expanded, setExpanded] = useState(false)

  useEffect(() => { setLocalR(dato?.responsable       || '') }, [dato?.responsable])
  useEffect(() => { setLocalF(dato?.fechaVerificacion || '') }, [dato?.fechaVerificacion])
  useEffect(() => { setLocalO(dato?.observaciones     || '') }, [dato?.observaciones])

  const emit = (patch) => onChange(item.codigo, patch)

  const estadoInfo = ESTADO_INFO[dato?.estado] || null
  const puntaje    = calcPuntaje(dato?.estado, item.peso)
  const esCondicional = item.aplicabilidad !== 'General'

  const rowCls = dato?.estado === 'CUMPLE_TOTALMENTE'
    ? 'bg-green-50/30'
    : dato?.estado === 'NO_CUMPLE'
    ? 'bg-red-50/30'
    : dato?.estado === 'NO_APLICA'
    ? 'opacity-55'
    : ''

  return (
    <>
      <tr className={`border-b border-slate-100 hover:bg-slate-50/40 transition-colors ${rowCls}`}>
        {/* 1. # */}
        <td className="px-2 py-2 text-center text-[10px] font-mono text-slate-400 w-8">{item.num}</td>
        {/* 2. Código */}
        <td className="px-2 py-2 text-[11px] font-mono font-bold text-slate-700 whitespace-nowrap w-16">{item.codigo}</td>
        {/* 3. PHVA */}
        <td className="px-2 py-2 w-16">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white whitespace-nowrap"
            style={{ background: PHVA_COLOR[item.phva] }}>
            {item.phva}
          </span>
        </td>
        {/* 4. Estándar */}
        <td className="px-2 py-2 text-[10px] text-slate-600 w-32 max-w-[120px]">
          <p className="truncate" title={item.estandar}>{item.estandar}</p>
        </td>
        {/* 5. Subestándar */}
        <td className="px-2 py-2 text-[10px] text-slate-500 w-36 max-w-[140px]">
          <p className="truncate" title={item.subestandar}>{item.subestandar}</p>
        </td>
        {/* 6. Ítem del estándar */}
        <td className="px-2 py-2 w-52 max-w-[200px]">
          <p className="text-[11px] font-medium text-slate-800 leading-snug line-clamp-2" title={item.item}>{item.item}</p>
          {esCondicional && (
            <span className="text-[9px] text-amber-600 font-semibold">⚠ Condicional</span>
          )}
        </td>
        {/* 7. Criterio / requisito */}
        <td className="px-2 py-2 w-52 max-w-[200px]">
          <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed" title={item.criterio}>{item.criterio}</p>
        </td>
        {/* 8. Evidencia sugerida */}
        <td className="px-2 py-2 w-44 max-w-[170px]">
          <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed" title={item.evidencia}>{item.evidencia}</p>
        </td>
        {/* 9. Aplicabilidad */}
        <td className="px-2 py-2 text-[10px] w-20 text-center">
          <span className={esCondicional ? 'text-amber-600 font-medium' : 'text-slate-500'}>
            {esCondicional ? 'Condicional' : 'General'}
          </span>
        </td>
        {/* Peso */}
        <td className="px-2 py-2 text-center text-[11px] font-mono font-bold text-slate-700 w-14">
          {item.peso}
        </td>
        {/* Estado */}
        <td className="px-2 py-2 w-44">
          <select
            value={dato?.estado || ''}
            onChange={e => emit({ estado: e.target.value })}
            className={`w-full h-7 px-1.5 rounded-md border text-[11px] focus:outline-none focus:ring-1 focus:ring-primary-500 ${estadoInfo?.cls || 'text-slate-400 bg-white border-slate-200'}`}>
            {OPCIONES_ESTADO.map(o => (
              <option key={o.value} value={o.value} className="bg-white text-slate-800">{o.label}</option>
            ))}
          </select>
        </td>
        {/* Puntaje obtenido */}
        <td className="px-2 py-2 text-center w-16">
          <span className={`text-[11px] font-bold tabular-nums ${
            puntaje > 0 ? 'text-green-700' : dato?.estado ? 'text-red-500' : 'text-slate-300'
          }`}>
            {dato?.estado ? puntaje.toFixed(puntaje % 1 === 0 ? 0 : 2) : '—'}
          </span>
        </td>
        {/* Responsable */}
        <td className="px-2 py-2 w-32">
          <input value={localResponsable}
            onChange={e => { setLocalR(e.target.value); clearTimeout(timerR.current); timerR.current = setTimeout(() => emit({ responsable: e.target.value }), debounceMs) }}
            placeholder="Responsable"
            className="w-full h-7 px-2 rounded border border-slate-200 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary-400 bg-transparent"
          />
        </td>
        {/* Fecha verificación */}
        <td className="px-2 py-2 w-32">
          <input type="date" value={localFecha}
            onChange={e => { setLocalF(e.target.value); emit({ fechaVerificacion: e.target.value }) }}
            className="w-full h-7 px-2 rounded border border-slate-200 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary-400 bg-transparent"
          />
        </td>
        {/* Observaciones */}
        <td className="px-2 py-2 w-40">
          <input value={localObs}
            onChange={e => { setLocalO(e.target.value); clearTimeout(timerO.current); timerO.current = setTimeout(() => emit({ observaciones: e.target.value }), debounceMs) }}
            placeholder="Observaciones"
            className="w-full h-7 px-2 rounded border border-slate-200 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary-400 bg-transparent"
          />
        </td>
        {/* Ref. legal */}
        <td className="px-2 py-2 text-[10px] text-slate-400 whitespace-nowrap w-24">{item.refLegal}</td>
      </tr>

    </>
  )
}

// ─── Grupo por estándar ───────────────────────────────────────────────────────

function GrupoEstandar({ estandar, items, itemsDatos, onChange }) {
  const [collapsed, setCollapsed] = useState(false)

  const totalPeso     = items.reduce((s, i) => s + i.peso, 0)
  const totalObtenido = items.reduce((s, i) => s + calcPuntaje(itemsDatos[i.codigo]?.estado, i.peso), 0)
  const evaluados     = items.filter(i => itemsDatos[i.codigo]?.estado).length
  const pctLocal      = totalPeso > 0 ? Math.round(totalObtenido / totalPeso * 100) : 0

  const phva = items[0]?.phva
  const colorPhva = PHVA_COLOR[phva] || '#64748b'

  return (
    <>
      {/* Cabecera del grupo */}
      <tr className="cursor-pointer select-none" onClick={() => setCollapsed(c => !c)}>
        <td colSpan={16} className="px-3 py-2.5"
          style={{ background: `${colorPhva}15`, borderTop: `2px solid ${colorPhva}40` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span style={{ color: colorPhva }}>
                {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </span>
              <span className="text-xs font-bold text-slate-800">{estandar}</span>
              <span className="text-[10px] text-slate-500">{evaluados}/{items.length} evaluados</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 w-32">
                <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pctLocal}%`, background: colorPhva }} />
                </div>
                <span className="text-[11px] font-bold" style={{ color: colorPhva }}>
                  {totalObtenido.toFixed(2)} / {totalPeso}
                </span>
              </div>
            </div>
          </div>
        </td>
      </tr>

      {/* Filas del grupo */}
      {!collapsed && items.map(item => (
        <FilaItem
          key={item.codigo}
          item={item}
          dato={itemsDatos[item.codigo]}
          onChange={onChange}
        />
      ))}
    </>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Page() {
  const [empresas,      setEmpresas]      = useState([])
  const [selEmpresaId,  setSelEmpresaId]  = useState('')
  const [selAño,        setSelAño]        = useState(AÑO_BASE)
  const [evaluacion,    setEvaluacion]    = useState(null)
  const [itemsDatos,    setItemsDatos]    = useState({})
  const [loading,       setLoading]       = useState(false)
  const [creating,      setCreating]      = useState(false)

  // Cargar empresas al arrancar
  useEffect(() => {
    empresaDB.getAll().then(e => setEmpresas(e || []))
  }, [])

  const empresa = useMemo(
    () => empresas.find(e => e.id === Number(selEmpresaId)) || null,
    [empresas, selEmpresaId]
  )

  // Cargar evaluación cuando cambia empresa + año
  const cargarEvaluacion = useCallback(async () => {
    if (!selEmpresaId) { setEvaluacion(null); setItemsDatos({}); return }
    setLoading(true)
    try {
      const ev = await evaluacionSGSSTDB.getByEmpresaAño(Number(selEmpresaId), selAño)
      if (ev) {
        const items = await itemEvaluacionDB.getByEvaluacion(ev.id)
        const mapa = {}
        ;(items || []).forEach(i => {
          mapa[i.codigo] = { estado: i.estado, responsable: i.responsable, fechaVerificacion: i.fechaVerificacion, observaciones: i.observaciones }
        })
        setEvaluacion(ev)
        setItemsDatos(mapa)
      } else {
        setEvaluacion(null)
        setItemsDatos({})
      }
    } finally { setLoading(false) }
  }, [selEmpresaId, selAño])

  useEffect(() => { cargarEvaluacion() }, [cargarEvaluacion])

  // Crear nueva evaluación
  const handleCrear = async () => {
    if (!selEmpresaId) return
    setCreating(true)
    try {
      const id = await evaluacionSGSSTDB.create({ empresaId: Number(selEmpresaId), año: selAño })
      setEvaluacion({ id, empresaId: Number(selEmpresaId), año: selAño })
      setItemsDatos({})
    } finally { setCreating(false) }
  }

  // Guardar cambio de un ítem (debounced desde FilaItem)
  const handleItemChange = useCallback(async (codigo, patch) => {
    if (!evaluacion?.id) return
    setItemsDatos(prev => ({ ...prev, [codigo]: { ...(prev[codigo] || {}), ...patch } }))
    await itemEvaluacionDB.upsert(evaluacion.id, codigo, {
      ...(itemsDatos[codigo] || {}),
      ...patch,
    })
  }, [evaluacion, itemsDatos])

  // Calcular puntajes
  const totalPuntaje = useMemo(() =>
    ITEMS_0312.reduce((s, i) => s + calcPuntaje(itemsDatos[i.codigo]?.estado, i.peso), 0),
    [itemsDatos]
  )

  const totalEvaluados = useMemo(() =>
    ITEMS_0312.filter(i => itemsDatos[i.codigo]?.estado).length,
    [itemsDatos]
  )

  const nivel = nivelCalificacion(totalPuntaje)

  // Puntaje por estándar
  const puntajeEstandar = useMemo(() => {
    const m = {}
    ESTANDARES.forEach(est => {
      const itsEst = ITEMS_0312.filter(i => i.estandar === est)
      const obtenido = itsEst.reduce((s, i) => s + calcPuntaje(itemsDatos[i.codigo]?.estado, i.peso), 0)
      const posible  = itsEst.reduce((s, i) => s + i.peso, 0)
      m[est] = { obtenido: Math.round(obtenido * 100) / 100, posible }
    })
    return m
  }, [itemsDatos])

  // Exportar Excel
  const exportarExcel = () => {
    if (!evaluacion) return
    const encabezado = [
      ['Checklist editable - Resolución 0312 de 2019'],
      [`Empresa: ${empresa?.razonSocial || ''} — NIT: ${empresa?.nit || ''} — Año: ${selAño}`],
      ['Use la columna Estado para diligenciar la autoevaluación.'],
      [],
      ['#','Código','Ciclo PHVA','Estándar','Subestándar','Ítem del estándar','Criterio / requisito','Evidencia sugerida','Aplicabilidad','Peso %','Estado','Puntaje obtenido','Responsable','Fecha verificación','Observaciones','Ref. legal'],
    ]
    const filas = ITEMS_0312.map(i => {
      const d = itemsDatos[i.codigo]
      return [
        i.num, i.codigo, i.phva, i.estandar, i.subestandar, i.item,
        i.criterio, i.evidencia, i.aplicabilidad, i.peso,
        ESTADO_INFO[d?.estado]?.label || '',
        d?.estado ? calcPuntaje(d.estado, i.peso) : '',
        d?.responsable || '', d?.fechaVerificacion || '',
        d?.observaciones || '', i.refLegal,
      ]
    })
    const total = ['TOTAL','','','','','','','','',100,'', Math.round(totalPuntaje * 100) / 100,'','','','']
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([...encabezado, ...filas, [], total])
    ws['!cols'] = [4,8,8,22,20,30,45,35,14,6,20,8,18,14,25,14].map(w => ({ wch: w }))
    XLSX.utils.book_append_sheet(wb, ws, 'Checklist_60')
    XLSX.writeFile(wb, `SG-SST_0312_${empresa?.nit || 'empresa'}_${selAño}.xlsx`)
  }

  return (
    <div className="p-3 sm:p-6 space-y-5">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck size={22} className="text-primary-700" strokeWidth={1.8} />
            Estándares Mínimos SG-SST
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Resolución 0312 de 2019 · Autoevaluación · 60 ítems · 100 puntos
          </p>
        </div>
        {evaluacion && (
          <button onClick={exportarExcel}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-xl transition-colors">
            <Download size={14} />
            Exportar Excel
          </button>
        )}
      </div>

      {/* Selector empresa + año */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-4">
          Seleccionar empresa y período de evaluación
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa *</label>
            <select value={selEmpresaId}
              onChange={e => setSelEmpresaId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Seleccionar empresa…</option>
              {empresas.map(e => (
                <option key={e.id} value={e.id}>{e.razonSocial} — NIT: {e.nit}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Año de evaluación</label>
            <select value={selAño} onChange={e => setSelAño(Number(e.target.value))}
              className="h-10 px-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
              {AÑOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {selEmpresaId && !evaluacion && !loading && (
            <button onClick={handleCrear} disabled={creating}
              className="flex items-center gap-2 h-10 px-4 bg-primary-700 hover:bg-primary-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
              <Plus size={14} />
              {creating ? 'Creando…' : 'Iniciar evaluación'}
            </button>
          )}
        </div>

        {/* NIT + info empresa */}
        {empresa && (
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <span>NIT: <strong className="text-slate-700">{empresa.nit || '—'}</strong></span>
            {empresa.sector && <span>Sector: {empresa.sector}</span>}
            {evaluacion && (
              <span className="flex items-center gap-1 text-green-600 font-semibold">
                <ShieldCheck size={11} />
                Evaluación activa
              </span>
            )}
          </div>
        )}
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-200 py-10 flex items-center justify-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500">Cargando evaluación…</p>
        </div>
      )}

      {/* Sin evaluación */}
      {!loading && selEmpresaId && !evaluacion && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-12 flex flex-col items-center gap-4">
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
            <ShieldCheck size={26} className="text-primary-700" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-700">No hay evaluación para {empresa?.razonSocial} — {selAño}</p>
            <p className="text-xs text-slate-400 mt-1">Haz clic en "Iniciar evaluación" para crear una nueva autoevaluación.</p>
          </div>
        </div>
      )}

      {/* Sin empresa seleccionada */}
      {!selEmpresaId && (
        <div className="bg-slate-50 rounded-2xl border border-slate-100 py-10 text-center">
          <p className="text-sm text-slate-400">Selecciona una empresa para comenzar la autoevaluación.</p>
        </div>
      )}

      {/* Panel de evaluación */}
      {!loading && evaluacion && (
        <>
          {/* Resumen */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Score total */}
            <div className="rounded-2xl border p-5 flex items-center gap-5"
              style={{ background: nivel.bg, borderColor: nivel.border }}>
              <div className="text-center flex-shrink-0">
                <p className="text-4xl font-black tabular-nums" style={{ color: nivel.color }}>
                  {Math.round(totalPuntaje * 10) / 10}
                </p>
                <p className="text-xs text-slate-500 font-medium">/ 100 pts</p>
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: nivel.color }}>{nivel.label}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {totalEvaluados} / {ITEMS_0312.length} ítems evaluados
                </p>
                <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden w-32">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(totalPuntaje, 100)}%`, background: nivel.color }} />
                </div>
              </div>
            </div>

            {/* Puntaje por estándar */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Puntaje por estándar</p>
              <div className="space-y-2">
                {ESTANDARES.map(est => {
                  const { obtenido, posible } = puntajeEstandar[est] || { obtenido: 0, posible: 0 }
                  const pct = posible > 0 ? Math.round(obtenido / posible * 100) : 0
                  const phva = ITEMS_0312.find(i => i.estandar === est)?.phva
                  const color = PHVA_COLOR[phva] || '#64748b'
                  return (
                    <div key={est} className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-600 w-48 truncate flex-shrink-0" title={est}>{est}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className="text-[11px] font-bold tabular-nums w-20 text-right flex-shrink-0" style={{ color }}>
                        {obtenido.toFixed(2)} / {posible}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Nota informativa */}
          <div className="flex items-start gap-2 px-4 py-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-700">
            <Info size={13} className="flex-shrink-0 mt-0.5" />
            <span>
              <strong>Calificación Res. 0312/2019:</strong> ≥ 86 pts = Aceptable · 61–85 = Moderadamente aceptable · ≤ 60 = Crítico.
              Los ítems "<em>No aplica</em>" reciben el puntaje completo. "<em>Cumple parcialmente</em>" y "<em>En revisión</em>" = 0 pts.
              Haz clic en <ChevronRight size={11} className="inline" /> para ver el criterio y la evidencia sugerida de cada ítem.
            </span>
          </div>

          {/* Tabla checklist */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[2000px]">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    {[
                      '#','Código','Ciclo PHVA',
                      'Estándar','Subestándar',
                      'Ítem del estándar',
                      'Criterio / requisito','Evidencia sugerida',
                      'Aplicabilidad','Peso %',
                      'Estado','Puntaje obtenido',
                      'Responsable','Fecha verificación','Observaciones','Ref. legal',
                    ].map(h => (
                      <th key={h} className="px-2 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide whitespace-nowrap border-r border-white/10 last:border-r-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ESTANDARES.map(est => (
                    <GrupoEstandar
                      key={est}
                      estandar={est}
                      items={ITEMS_0312.filter(i => i.estandar === est)}
                      itemsDatos={itemsDatos}
                      onChange={handleItemChange}
                    />
                  ))}
                </tbody>
                {/* Fila total */}
                <tfoot>
                  <tr className="bg-slate-800 text-white">
                    <td colSpan={9} className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wide">
                      TOTAL
                    </td>
                    <td className="px-2 py-2.5 text-center text-sm font-black">100</td>
                    <td className="px-2 py-2.5 text-center text-xs font-bold" style={{ color: nivel.color, background: nivel.bg }}>
                      {nivel.label}
                    </td>
                    <td className="px-2 py-2.5 text-center text-sm font-black">
                      {Math.round(totalPuntaje * 100) / 100}
                    </td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
