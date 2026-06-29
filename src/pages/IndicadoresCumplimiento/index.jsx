import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  BarChart2, Plus, Pencil, Trash2, X, ArrowLeft, Save, CheckCircle2,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine, LabelList,
} from 'recharts'
import {
  indicadorDB, datoIndicadorDB, planAccionIndicadorDB, empresaDB,
} from '@/db'

// ─── Constantes ───────────────────────────────────────────────────────────────

const MESES     = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']
const AÑO_BASE  = new Date().getFullYear()
const AÑOS      = [AÑO_BASE - 1, AÑO_BASE, AÑO_BASE + 1]

const PERIODICIDADES = ['Mensual','Trimestral','Semestral','Anual']
const TIPOS_IND      = ['Proceso','Resultado','Gestión','Eficacia','Eficiencia','Efectividad']

const AZUL_SST = '#1B3A6B'

const INP  = 'w-full h-9 px-3 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500'
const AREA = 'w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none'

function colorSeguimiento(pct, meta) {
  if (pct === null) return '#cbd5e1'
  if (pct >= meta)  return '#22c55e'
  if (pct >= 50)    return '#f59e0b'
  return '#ef4444'
}

const EMPTY_IND = {
  empresaId: '',
  numero: '',
  nombre: '',
  tipoIndicador: 'Proceso',
  definicion: '',
  nombreNumerador: '',
  nombreDenominador: '',
  periodicidad: 'Mensual',
  meta: 90,
}

// ─── Modal crear/editar indicador ─────────────────────────────────────────────

function IndicadorModal({ form, set, empresas, onClose, onSave, saving, errs }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.55)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto">

        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {form.id ? 'Editar indicador' : 'Nuevo indicador'}
            </h2>
            <p className="text-xs text-slate-400">Ficha técnica de indicador de cumplimiento</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">N.° de indicador *</label>
              <input type="number" min={1} value={form.numero}
                onChange={e => set(f => ({ ...f, numero: Number(e.target.value) }))}
                placeholder="21"
                className={`${INP} ${errs.numero ? 'border-red-400' : ''}`}
              />
              {errs.numero && <p className="text-xs text-red-500 mt-0.5">{errs.numero}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Empresa</label>
              <select value={form.empresaId}
                onChange={e => set(f => ({ ...f, empresaId: Number(e.target.value) }))}
                className={INP}>
                <option value="">Todas las empresas</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del indicador *</label>
            <input value={form.nombre}
              onChange={e => set(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: Cumplimiento de Inducción"
              className={`${INP} ${errs.nombre ? 'border-red-400' : ''}`}
            />
            {errs.nombre && <p className="text-xs text-red-500 mt-0.5">{errs.nombre}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de indicador</label>
              <select value={form.tipoIndicador}
                onChange={e => set(f => ({ ...f, tipoIndicador: e.target.value }))}
                className={INP}>
                {TIPOS_IND.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Periodicidad</label>
              <select value={form.periodicidad}
                onChange={e => set(f => ({ ...f, periodicidad: e.target.value }))}
                className={INP}>
                {PERIODICIDADES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Definición del indicador</label>
            <textarea value={form.definicion}
              onChange={e => set(f => ({ ...f, definicion: e.target.value }))}
              rows={2}
              placeholder="Ej: Medición de inducción del personal"
              className={AREA}
            />
          </div>

          {/* Método de cálculo */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">
              Método de Cálculo (Numerador / Denominador × 100%)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre del Numerador *</label>
                <input value={form.nombreNumerador}
                  onChange={e => set(f => ({ ...f, nombreNumerador: e.target.value }))}
                  placeholder="Ej: INDUCCIONES EJECUTADAS"
                  className={`${INP} ${errs.nombreNumerador ? 'border-red-400' : ''}`}
                />
                {errs.nombreNumerador && <p className="text-xs text-red-500 mt-0.5">{errs.nombreNumerador}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre del Denominador *</label>
                <input value={form.nombreDenominador}
                  onChange={e => set(f => ({ ...f, nombreDenominador: e.target.value }))}
                  placeholder="Ej: INDUCCIONES PROGRAMADAS"
                  className={`${INP} ${errs.nombreDenominador ? 'border-red-400' : ''}`}
                />
                {errs.nombreDenominador && <p className="text-xs text-red-500 mt-0.5">{errs.nombreDenominador}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Meta (%)</label>
            <div className="flex items-center gap-2">
              <input type="number" min={0} max={100} value={form.meta}
                onChange={e => set(f => ({ ...f, meta: Number(e.target.value) }))}
                className="w-24 h-9 px-3 rounded-lg border border-slate-300 text-sm text-center bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-500 font-medium">%</span>
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
            {saving ? 'Guardando…' : form.id ? 'Guardar cambios' : 'Crear indicador'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Celda editable de datos mensuales ───────────────────────────────────────

function CeldaDato({ value, onChange }) {
  const [local, setLocal] = useState(value ?? '')
  const inputRef = useRef()

  useEffect(() => { setLocal(value ?? '') }, [value])

  return (
    <input
      ref={inputRef}
      type="number"
      min={0}
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => {
        const n = local === '' ? null : Number(local)
        if (n !== value) onChange(n)
      }}
      className="w-full text-center text-xs font-mono bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary-400 focus:rounded p-0.5"
      placeholder="—"
    />
  )
}

// ─── Ficha Técnica ────────────────────────────────────────────────────────────

function FichaTecnica({ indicador, año, onAñoChange, datos, onDatoChange, planes, onPlanCreate, onPlanUpdate, onPlanDelete }) {
  const [newPlan, setNewPlan] = useState({ planAccion: '', fechaEjecucion: '', observaciones: '' })
  const [editPlanId, setEditPlanId] = useState(null)
  const [editPlanForm, setEditPlanForm] = useState({})
  const [savingPlan, setSavingPlan] = useState(false)

  // Calcular seguimiento mensual
  const seguimiento = useMemo(() =>
    MESES.map((_, i) => {
      const mes = i + 1
      const d   = datos[mes]
      if (!d || d.programadas === null || d.programadas === undefined || d.programadas === 0) return null
      if (d.ejecutadas === null || d.ejecutadas === undefined) return null
      return Math.round((d.ejecutadas / d.programadas) * 100)
    }),
    [datos]
  )

  // Datos para la gráfica
  const chartData = MESES.map((m, i) => ({
    mes: m,
    pct: seguimiento[i],
    meta: indicador.meta,
  }))

  const handleAddPlan = async () => {
    if (!newPlan.planAccion.trim()) return
    setSavingPlan(true)
    try {
      await onPlanCreate({ ...newPlan, indicadorId: indicador.id })
      setNewPlan({ planAccion: '', fechaEjecucion: '', observaciones: '' })
    } finally { setSavingPlan(false) }
  }

  const handleSaveEdit = async () => {
    setSavingPlan(true)
    try {
      await onPlanUpdate(editPlanId, editPlanForm)
      setEditPlanId(null)
    } finally { setSavingPlan(false) }
  }

  // Estilos de la ficha
  const TH = 'px-3 py-2 text-left text-[11px] font-bold text-white uppercase tracking-wide'
  const TD = 'px-3 py-2 text-xs text-slate-800 border-b border-slate-100'
  const TDL = `${TD} font-semibold text-slate-600 bg-slate-50 w-44`

  return (
    <div className="space-y-0 rounded-2xl overflow-hidden border border-slate-300 shadow-sm">

      {/* ── Título principal ─────────────────────────────────────────── */}
      <div style={{ background: AZUL_SST }} className="text-white text-center py-3 px-4 flex items-center justify-between">
        <div className="flex-1" />
        <p className="text-sm font-bold tracking-widest uppercase flex-1 text-center">
          FICHA TÉCNICA — {indicador.nombre || 'SIN NOMBRE'}
        </p>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-xs text-white/70">Año:</span>
          <select value={año} onChange={e => onAñoChange(Number(e.target.value))}
            className="h-7 px-2 rounded text-xs bg-white/10 text-white border border-white/20 focus:outline-none">
            {AÑOS.map(a => <option key={a} value={a} className="text-slate-800 bg-white">{a}</option>)}
          </select>
        </div>
      </div>

      {/* ── Sección 1: Información del indicador ─────────────────────── */}
      <div>
        <div style={{ background: AZUL_SST }} className="py-1.5 px-4">
          <p className="text-[11px] font-bold text-white tracking-wider">1. INFORMACIÓN DEL INDICADOR</p>
        </div>

        <table className="w-full border-collapse text-sm">
          <tbody>
            {[
              { label: 'Número de indicador:', value: indicador.numero || '—' },
              { label: 'Nombre del Indicador:', value: indicador.nombre || '—' },
              { label: 'Tipo de indicador:',    value: indicador.tipoIndicador || '—' },
              { label: 'Definición del indicador:', value: indicador.definicion || '—' },
            ].map(({ label, value }) => (
              <tr key={label} className="border-b border-slate-100">
                <td className={TDL}>{label}</td>
                <td className={TD}>{value}</td>
              </tr>
            ))}

            {/* Método de cálculo — como fracción */}
            <tr className="border-b border-slate-100">
              <td className={TDL}>Método de Cálculo:</td>
              <td className={TD}>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-semibold text-slate-700 uppercase">
                      {indicador.nombreNumerador || 'NUMERADOR'}
                    </span>
                    <div className="border-t border-slate-600 w-full my-0.5" />
                    <span className="text-xs font-semibold text-slate-700 uppercase">
                      {indicador.nombreDenominador || 'DENOMINADOR'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-700">× 100%</span>
                </div>
              </td>
            </tr>

            {[
              { label: 'Periodicidad:', value: indicador.periodicidad || '—' },
              { label: 'Meta:',         value: indicador.meta != null ? `${indicador.meta}%` : '—' },
            ].map(({ label, value }) => (
              <tr key={label} className="border-b border-slate-100">
                <td className={TDL}>{label}</td>
                <td className={TD}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Sección 2: Datos mensuales ───────────────────────────────── */}
      <div>
        <div style={{ background: AZUL_SST }} className="py-1.5 px-4">
          <p className="text-[11px] font-bold text-white tracking-wider">2. DATOS</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs min-w-[900px]">
            <thead>
              {/* Año */}
              <tr>
                <td className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 border-b border-r border-slate-200 w-44" />
                <td colSpan={12} className="text-center text-xs font-bold text-slate-700 bg-slate-50 border-b border-slate-200 py-1.5 tracking-wider">
                  {año}
                </td>
              </tr>
              {/* Meses */}
              <tr>
                <td className="px-3 py-2 text-[11px] font-bold text-slate-500 bg-slate-50 border-b border-r border-slate-200">
                  Variables
                </td>
                {MESES.map(m => (
                  <td key={m} className="text-center text-[11px] font-bold text-white py-2 border-b border-r border-slate-300 last:border-r-0"
                    style={{ background: AZUL_SST }}>
                    {m}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Fila numerador (ejecutadas) */}
              <tr className="hover:bg-slate-50/50">
                <td className="px-3 py-2 text-[11px] font-semibold text-slate-600 bg-slate-50 border-b border-r border-slate-200 uppercase">
                  {indicador.nombreNumerador || 'NUMERADOR'}
                </td>
                {MESES.map((_, i) => {
                  const mes = i + 1
                  return (
                    <td key={mes} className="text-center border-b border-r border-slate-100 last:border-r-0 p-0.5">
                      <CeldaDato
                        value={datos[mes]?.ejecutadas ?? ''}
                        onChange={v => onDatoChange(mes, 'ejecutadas', v)}
                      />
                    </td>
                  )
                })}
              </tr>

              {/* Fila denominador (programadas) */}
              <tr className="hover:bg-slate-50/50">
                <td className="px-3 py-2 text-[11px] font-semibold text-slate-600 bg-slate-50 border-b border-r border-slate-200 uppercase">
                  {indicador.nombreDenominador || 'DENOMINADOR'}
                </td>
                {MESES.map((_, i) => {
                  const mes = i + 1
                  return (
                    <td key={mes} className="text-center border-b border-r border-slate-100 last:border-r-0 p-0.5">
                      <CeldaDato
                        value={datos[mes]?.programadas ?? ''}
                        onChange={v => onDatoChange(mes, 'programadas', v)}
                      />
                    </td>
                  )
                })}
              </tr>

              {/* Fila seguimiento mensual (calculado) */}
              <tr className="bg-slate-50">
                <td className="px-3 py-2 text-[11px] font-bold text-slate-700 border-r border-slate-200 uppercase">
                  Seguimiento mensual
                </td>
                {seguimiento.map((pct, i) => (
                  <td key={i} className="text-center border-r border-slate-100 last:border-r-0 py-2">
                    {pct !== null
                      ? <span className={`text-[11px] font-bold ${pct >= (indicador.meta || 90) ? 'text-green-700' : pct >= 50 ? 'text-yellow-700' : 'text-red-600'}`}>
                          {pct}%
                        </span>
                      : <span className="text-slate-300 text-[10px]">—</span>
                    }
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-slate-400 px-4 py-1.5">
          💡 Haz clic en cualquier celda de numerador o denominador para ingresar valores. El seguimiento mensual se calcula automáticamente.
        </p>
      </div>

      {/* ── Sección 3: Gráfica ───────────────────────────────────────── */}
      <div>
        <div style={{ background: AZUL_SST }} className="py-1.5 px-4">
          <p className="text-[11px] font-bold text-white tracking-wider">3. GRÁFICA</p>
        </div>

        <div className="p-4 bg-white">
          {seguimiento.every(v => v === null) ? (
            <div className="h-40 flex items-center justify-center">
              <p className="text-sm text-slate-400">Ingresa datos en la tabla para ver la gráfica.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]}
                  tickFormatter={v => `${v}%`} />
                <Tooltip
                  formatter={(v) => v !== null ? [`${v}%`, 'Seguimiento'] : ['—', 'Seguimiento']}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                {indicador.meta != null && (
                  <ReferenceLine y={indicador.meta} stroke="#1B3A6B" strokeDasharray="5 3"
                    label={{ value: `Meta ${indicador.meta}%`, position: 'insideTopRight', fontSize: 10, fill: AZUL_SST }} />
                )}
                <Bar dataKey="pct" radius={[3, 3, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={colorSeguimiento(d.pct, indicador.meta || 90)} />
                  ))}
                  <LabelList dataKey="pct" position="top"
                    formatter={v => v !== null ? `${v}%` : ''}
                    style={{ fontSize: 10, fill: '#64748b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Planes de acción ─────────────────────────────────────────── */}
      <div>
        <div style={{ background: AZUL_SST }} className="py-1.5 px-4">
          <p className="text-[11px] font-bold text-white tracking-wider">
            DETERMINACIÓN DE PLANES DE ACCIÓN
          </p>
        </div>

        <table className="w-full border-collapse text-xs">
          <thead>
            <tr style={{ background: AZUL_SST }}>
              <th className={`${TH} border-r border-white/20 w-[50%]`}>Plan de Acción</th>
              <th className={`${TH} border-r border-white/20 w-36`}>Fecha de Ejecución</th>
              <th className={`${TH} w-[35%]`}>Observaciones</th>
              <th className={`${TH} w-16`} />
            </tr>
          </thead>
          <tbody>
            {planes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-slate-400 text-xs italic border-b border-slate-100">
                  No hay planes de acción. Agrega uno abajo.
                </td>
              </tr>
            )}
            {planes.map(p => (
              <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                {editPlanId === p.id ? (
                  <>
                    <td className="px-2 py-1.5 border-r border-slate-100">
                      <textarea value={editPlanForm.planAccion || ''}
                        onChange={e => setEditPlanForm(f => ({ ...f, planAccion: e.target.value }))}
                        rows={2} className="w-full px-2 py-1 rounded border border-slate-300 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary-500" />
                    </td>
                    <td className="px-2 py-1.5 border-r border-slate-100">
                      <input type="date" value={editPlanForm.fechaEjecucion || ''}
                        onChange={e => setEditPlanForm(f => ({ ...f, fechaEjecucion: e.target.value }))}
                        className="w-full h-7 px-2 rounded border border-slate-300 text-xs focus:outline-none" />
                    </td>
                    <td className="px-2 py-1.5">
                      <textarea value={editPlanForm.observaciones || ''}
                        onChange={e => setEditPlanForm(f => ({ ...f, observaciones: e.target.value }))}
                        rows={2} className="w-full px-2 py-1 rounded border border-slate-300 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary-500" />
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex gap-1">
                        <button onClick={handleSaveEdit} disabled={savingPlan}
                          className="p-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors" title="Guardar">
                          <CheckCircle2 size={13} />
                        </button>
                        <button onClick={() => setEditPlanId(null)}
                          className="p-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors" title="Cancelar">
                          <X size={13} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2 border-r border-slate-100 text-slate-800 leading-relaxed">
                      {p.planAccion || '—'}
                    </td>
                    <td className="px-3 py-2 border-r border-slate-100 text-slate-500 whitespace-nowrap font-mono">
                      {p.fechaEjecucion || '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-500 leading-relaxed">{p.observaciones || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditPlanId(p.id); setEditPlanForm({ ...p }) }}
                          className="p-1 rounded text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors" title="Editar">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => onPlanDelete(p.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {/* Fila para agregar nuevo plan */}
            <tr className="bg-slate-50/60">
              <td className="px-2 py-2 border-r border-slate-100">
                <textarea value={newPlan.planAccion}
                  onChange={e => setNewPlan(p => ({ ...p, planAccion: e.target.value }))}
                  rows={2}
                  placeholder="Describe el plan de acción…"
                  className="w-full px-2 py-1 rounded border border-slate-200 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                />
              </td>
              <td className="px-2 py-2 border-r border-slate-100">
                <input type="date" value={newPlan.fechaEjecucion}
                  onChange={e => setNewPlan(p => ({ ...p, fechaEjecucion: e.target.value }))}
                  className="w-full h-7 px-2 rounded border border-slate-200 text-xs focus:outline-none bg-white"
                />
              </td>
              <td className="px-2 py-2">
                <textarea value={newPlan.observaciones}
                  onChange={e => setNewPlan(p => ({ ...p, observaciones: e.target.value }))}
                  rows={2}
                  placeholder="Observaciones…"
                  className="w-full px-2 py-1 rounded border border-slate-200 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                />
              </td>
              <td className="px-2 py-2">
                <button onClick={handleAddPlan} disabled={!newPlan.planAccion.trim() || savingPlan}
                  className="flex items-center gap-1 px-2 py-1.5 bg-primary-700 hover:bg-primary-800 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-40 whitespace-nowrap">
                  <Plus size={11} />
                  Agregar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Tarjeta de indicador (lista) ─────────────────────────────────────────────

function IndicadorCard({ ind, pctActual, onClick, onEdit, onDelete }) {
  const meta = ind.meta ?? 90
  const color = pctActual !== null
    ? (pctActual >= meta ? 'text-green-600' : pctActual >= 50 ? 'text-yellow-600' : 'text-red-600')
    : 'text-slate-400'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer group"
         onClick={onClick}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded"
                style={{ background: AZUL_SST }}>
                #{ind.numero || '—'}
              </span>
              <span className="text-[10px] text-slate-400">{ind.tipoIndicador}</span>
            </div>
            <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{ind.nombre}</p>
            <p className="text-xs text-slate-400 mt-1 line-clamp-1">{ind.definicion || 'Sin definición'}</p>
          </div>
          <div className="flex flex-col items-center ml-3 flex-shrink-0">
            <span className={`text-2xl font-black tabular-nums ${color}`}>
              {pctActual !== null ? `${pctActual}%` : '—'}
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5">Meta: {meta}%</span>
          </div>
        </div>

        {/* Mini barra de progreso */}
        <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: pctActual !== null ? `${Math.min(pctActual, 100)}%` : '0%',
              background: pctActual !== null
                ? (pctActual >= meta ? '#22c55e' : pctActual >= 50 ? '#f59e0b' : '#ef4444')
                : '#e2e8f0',
            }} />
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-[10px] text-slate-400">{ind.periodicidad}</span>
          <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={e => { e.stopPropagation(); onEdit() }}
              className="p-1.5 rounded-md text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors" title="Editar">
              <Pencil size={12} />
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete() }}
              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Eliminar">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Page() {
  const [indicadores, setIndicadores] = useState([])
  const [empresas,    setEmpresas]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [selectedId,  setSelectedId]  = useState(null)
  const [selectedAño, setSelectedAño] = useState(AÑO_BASE)
  const [datos,       setDatos]       = useState({})
  const [planes,      setPlanes]      = useState([])
  const [modal,       setModal]       = useState({ open: false, form: { ...EMPTY_IND } })
  const [saving,      setSaving]      = useState(false)
  const [errs,        setErrs]        = useState({})
  const [delId,       setDelId]       = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [inds, emps] = await Promise.all([indicadorDB.getAll(), empresaDB.getAll()])
      setIndicadores(inds || [])
      setEmpresas(emps   || [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Cargar datos y planes cuando se selecciona un indicador + año
  useEffect(() => {
    if (!selectedId) { setDatos({}); setPlanes([]); return }
    ;(async () => {
      const [d, p] = await Promise.all([
        datoIndicadorDB.getByIndicadorAño(selectedId, selectedAño),
        planAccionIndicadorDB.getByIndicador(selectedId),
      ])
      const datoMap = {}
      ;(d || []).forEach(item => {
        datoMap[item.mes] = { ejecutadas: item.ejecutadas, programadas: item.programadas }
      })
      setDatos(datoMap)
      setPlanes(p || [])
    })()
  }, [selectedId, selectedAño])

  const selectedIndicador = useMemo(
    () => indicadores.find(i => i.id === selectedId) || null,
    [indicadores, selectedId]
  )

  // Promedio de seguimiento del año para las tarjetas
  const pctPorIndicador = useMemo(() => {
    // Para cada indicador, necesitaríamos cargar datos.
    // Simplificado: mostramos null (se muestra — en la tarjeta)
    return {}
  }, [indicadores])

  // ── Handlers de datos mensuales ──────────────────────────────────────────
  const handleDatoChange = useCallback(async (mes, campo, valor) => {
    setDatos(prev => ({
      ...prev,
      [mes]: { ...(prev[mes] || {}), [campo]: valor },
    }))
    await datoIndicadorDB.upsert(selectedId, mes, selectedAño, {
      ejecutadas:  campo === 'ejecutadas'  ? valor : datos[mes]?.ejecutadas  ?? null,
      programadas: campo === 'programadas' ? valor : datos[mes]?.programadas ?? null,
    })
  }, [selectedId, selectedAño, datos])

  // ── Handlers de planes ───────────────────────────────────────────────────
  const handlePlanCreate = async (data) => {
    const id = await planAccionIndicadorDB.create(data)
    setPlanes(p => [...p, { ...data, id }])
  }
  const handlePlanUpdate = async (id, data) => {
    await planAccionIndicadorDB.update(id, data)
    setPlanes(p => p.map(x => x.id === id ? { ...x, ...data } : x))
  }
  const handlePlanDelete = async (id) => {
    await planAccionIndicadorDB.remove(id)
    setPlanes(p => p.filter(x => x.id !== id))
  }

  // ── CRUD indicadores ─────────────────────────────────────────────────────
  const validate = (f) => {
    const e = {}
    if (!f.numero)                e.numero           = 'Requerido'
    if (!f.nombre?.trim())        e.nombre           = 'Requerido'
    if (!f.nombreNumerador?.trim())e.nombreNumerador  = 'Requerido'
    if (!f.nombreDenominador?.trim())e.nombreDenominador = 'Requerido'
    return e
  }

  const handleSave = async () => {
    const e = validate(modal.form)
    if (Object.keys(e).length) { setErrs(e); return }
    setSaving(true)
    try {
      const { id, ...data } = modal.form
      if (id) await indicadorDB.update(id, data)
      else    await indicadorDB.create(data)
      await cargar()
      setModal({ open: false, form: { ...EMPTY_IND } })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    await datoIndicadorDB.removeByIndicador(delId)
    await planAccionIndicadorDB.removeByIndicador(delId)
    await indicadorDB.remove(delId)
    if (selectedId === delId) setSelectedId(null)
    setIndicadores(p => p.filter(i => i.id !== delId))
    setDelId(null)
  }

  const abrirNuevo  = () => { setErrs({}); setModal({ open: true, form: { ...EMPTY_IND } }) }
  const abrirEditar = (ind) => { setErrs({}); setModal({ open: true, form: { ...ind } }) }

  return (
    <div className="p-3 sm:p-6 space-y-5">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {selectedIndicador && (
            <button onClick={() => setSelectedId(null)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors" title="Volver a la lista">
              <ArrowLeft size={16} className="text-slate-600" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 size={22} style={{ color: AZUL_SST }} strokeWidth={1.8} />
              Indicadores de Cumplimiento
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {selectedIndicador
                ? `Ficha técnica — ${selectedIndicador.nombre}`
                : 'Fichas técnicas de indicadores SST'}
            </p>
          </div>
        </div>
        {!selectedIndicador && (
          <button onClick={abrirNuevo}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            style={{ background: AZUL_SST }}>
            <Plus size={15} />
            Nuevo indicador
          </button>
        )}
      </div>

      {/* Vista lista */}
      {!selectedIndicador ? (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : indicadores.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 py-16 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${AZUL_SST}15` }}>
              <BarChart2 size={28} style={{ color: AZUL_SST }} strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">No hay indicadores creados</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Crea el primero con el botón "Nuevo indicador" para comenzar a registrar el seguimiento de cumplimiento SST.
              </p>
            </div>
            <button onClick={abrirNuevo}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-xl"
              style={{ background: AZUL_SST }}>
              <Plus size={14} />
              Crear primer indicador
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {indicadores.map(ind => (
              <IndicadorCard
                key={ind.id}
                ind={ind}
                pctActual={pctPorIndicador[ind.id] ?? null}
                onClick={() => setSelectedId(ind.id)}
                onEdit={() => abrirEditar(ind)}
                onDelete={() => setDelId(ind.id)}
              />
            ))}
          </div>
        )
      ) : (
        /* Vista ficha técnica */
        <FichaTecnica
          indicador={selectedIndicador}
          año={selectedAño}
          onAñoChange={setSelectedAño}
          datos={datos}
          onDatoChange={handleDatoChange}
          planes={planes}
          onPlanCreate={handlePlanCreate}
          onPlanUpdate={handlePlanUpdate}
          onPlanDelete={handlePlanDelete}
        />
      )}

      {/* Modal crear/editar indicador */}
      {modal.open && (
        <IndicadorModal
          form={modal.form}
          set={(fn) => setModal(m => ({ ...m, form: fn(m.form) }))}
          empresas={empresas}
          onClose={() => setModal({ open: false, form: { ...EMPTY_IND } })}
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
            <h3 className="text-base font-bold text-slate-900 mb-2">¿Eliminar indicador?</h3>
            <p className="text-sm text-slate-500 mb-5">
              Se eliminarán todos los datos mensuales y planes de acción asociados.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDelId(null)}
                className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">
                Cancelar
              </button>
              <button onClick={handleDelete}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
