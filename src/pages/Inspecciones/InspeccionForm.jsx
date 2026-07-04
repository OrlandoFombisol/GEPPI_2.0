import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, ChevronLeft, Save, CheckCircle2, XCircle, MinusCircle, ChevronRight } from 'lucide-react'
import { inspeccionDB, planTrabajoDB } from '@/db'
import { TIPOS_INSPECCION, ITEMS_POR_TIPO } from './items'

// ── Compresión de foto ────────────────────────────────────────────────────────
async function comprimirFoto(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1000
      let { width: w, height: h } = img
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else       { w = Math.round(w * MAX / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', 0.72))
      URL.revokeObjectURL(url)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Error al procesar imagen')) }
    img.src = url
  })
}

// ── Paso 1: Selector de tipo ──────────────────────────────────────────────────
function SelectorTipo({ onSelect }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-6 pb-5"
        style={{ background: 'linear-gradient(135deg, #0f2d6e 0%, #1b62cc 100%)' }}>
        <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-1">Nueva inspección</p>
        <h1 className="text-2xl font-black text-white">¿Qué vas a inspeccionar?</h1>
        <p className="text-sm text-blue-200 mt-1">Selecciona el tipo de inspección a realizar</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-3 max-w-lg mx-auto">
          {TIPOS_INSPECCION.map((meta, i) => (
            <motion.button
              key={meta.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.015, boxShadow: `0 8px 30px ${meta.color}30` }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(meta.value)}
              className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-left w-full"
            >
              {/* Icono grande */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: `${meta.color}18`, border: `2px solid ${meta.color}30` }}>
                {meta.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-slate-800">{meta.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {ITEMS_POR_TIPO[meta.value]?.length || 0} ítems de inspección
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${meta.color}18` }}>
                <ChevronRight size={16} style={{ color: meta.color }} />
              </div>
            </motion.button>
          ))}
        </div>
        <div className="h-6" />
      </div>
    </div>
  )
}

// ── Resultado: botones grandes táctiles ───────────────────────────────────────
const RESULTADO_CFG = [
  { value: 'CUMPLE',    label: 'Cumple',    Icon: CheckCircle2, idle: 'border-slate-200 bg-white text-slate-500',        active: 'border-emerald-500 bg-emerald-500 text-white' },
  { value: 'NO_CUMPLE', label: 'No cumple', Icon: XCircle,      idle: 'border-slate-200 bg-white text-slate-500',        active: 'border-red-500     bg-red-500     text-white' },
  { value: 'NO_APLICA', label: 'N/A',       Icon: MinusCircle,  idle: 'border-slate-200 bg-white text-slate-400',        active: 'border-slate-500   bg-slate-500   text-white' },
]
const ACCION_TIPOS = ['CORRECTIVA', 'PREVENTIVA', 'MEJORA']

function ItemInspeccion({ item, resultado, accionTipo, accionDescripcion, onChange, onAccion, index }) {
  const isCumple    = resultado === 'CUMPLE'
  const isNoCumple  = resultado === 'NO_CUMPLE'
  const isNoAplica  = resultado === 'NO_APLICA'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-3"
    >
      {/* Número + label */}
      <div className="flex items-start gap-2 mb-3">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center mt-0.5">
          {index + 1}
        </span>
        <p className="text-sm font-semibold text-slate-800 leading-snug">{item.label}</p>
      </div>

      {/* Botones resultado */}
      <div className="grid grid-cols-3 gap-2">
        {RESULTADO_CFG.map(({ value, label, Icon, idle, active }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(item.id, value)}
            className={[
              'flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all font-semibold text-xs',
              resultado === value ? active : idle,
            ].join(' ')}
          >
            <Icon size={20} strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>

      {/* Acción cuando No cumple */}
      <AnimatePresence>
        {isNoCumple && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-red-100 space-y-2">
              <p className="text-xs font-semibold text-red-600 mb-2">Tipo de acción a implementar:</p>
              <div className="flex gap-2">
                {ACCION_TIPOS.map(tipo => (
                  <button key={tipo} type="button"
                    onClick={() => onAccion(item.id, 'tipo', tipo)}
                    className={[
                      'flex-1 py-2 text-xs font-bold rounded-xl border-2 transition-all',
                      accionTipo === tipo
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
                    ].join(' ')}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
              <textarea
                value={accionDescripcion || ''} rows={2}
                onChange={e => onAccion(item.id, 'descripcion', e.target.value)}
                placeholder="Describa la acción a implementar…"
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-slate-50"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Formulario principal ──────────────────────────────────────────────────────
export default function InspeccionForm({ empresas = [], actividadesPAT = [], usuarioId, onGuardado, onCancelar }) {
  const [tipo,        setTipo]        = useState('')
  const [empresaId,   setEmpresaId]   = useState('')
  const [fecha,       setFecha]       = useState(new Date().toISOString().slice(0, 10))
  const [inspector,   setInspector]   = useState('')
  const [planId,      setPlanId]      = useState('')
  const [foto,        setFoto]        = useState(null)
  const [resultados,  setResultados]  = useState({})
  const [acciones,    setAcciones]    = useState({})
  const [observacion, setObservacion] = useState('')
  const [guardando,   setGuardando]   = useState(false)
  const [error,       setError]       = useState('')
  const fotoRef = useRef(null)

  const tipoMeta    = TIPOS_INSPECCION.find(t => t.value === tipo)
  const items       = tipo ? (ITEMS_POR_TIPO[tipo] || []) : []
  const respondidos = items.filter(i => resultados[i.id]).length
  const pct         = items.length > 0 ? Math.round((respondidos / items.length) * 100) : 0
  const actsFilt    = actividadesPAT.filter(a =>
    (!empresaId || String(a.empresaId) === String(empresaId)) && a.estado === 'PENDIENTE')

  if (!tipo) return <SelectorTipo onSelect={v => { setTipo(v); setResultados({}) }} />

  const handleResultado = (id, valor) => setResultados(p => ({ ...p, [id]: valor }))
  const handleAccion    = (id, campo, valor) => setAcciones(p => ({ ...p, [id]: { ...p[id], [campo]: valor } }))
  const handleFoto      = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try { setFoto(await comprimirFoto(file)) }
    catch { setError('No se pudo procesar la foto.') }
  }

  const handleGuardar = async () => {
    setError('')
    if (!empresaId)        return setError('Selecciona la empresa.')
    if (!inspector.trim()) return setError('Ingresa el nombre del inspector.')
    if (respondidos < items.length)
      return setError(`Responde todos los ítems (${respondidos}/${items.length} completados).`)
    setGuardando(true)
    try {
      const itemsArray = items.map(item => ({
        id: item.id, label: item.label,
        resultado:         resultados[item.id],
        accionTipo:        acciones[item.id]?.tipo        || null,
        accionDescripcion: acciones[item.id]?.descripcion || null,
      }))
      const inspeccionId = await inspeccionDB.create({
        tipo, empresaId: Number(empresaId), fecha,
        inspector: inspector.trim(),
        items:     itemsArray,
        fotoBase64: foto || null,
        observacionGeneral: observacion.trim() || null,
        planTrabajoId: planId ? Number(planId) : null,
        usuarioId: usuarioId || null,
      })
      if (planId) await planTrabajoDB.update(Number(planId), { estado: 'EJECUTADO' })
      onGuardado(inspeccionId)
    } catch (err) {
      setError('Error al guardar: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden">

      {/* ── Header dinámico ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden flex-shrink-0"
        style={{ background: tipoMeta ? `linear-gradient(135deg, ${tipoMeta.color}dd, ${tipoMeta.color}88)` : 'linear-gradient(135deg,#0f2d6e,#1b62cc)' }}>

        <div className="flex items-center gap-3 px-4 pt-4 pb-2 relative">
          <button onClick={() => { setTipo(''); setResultados({}) }}
            className="p-1.5 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-base font-black text-white">
              {tipoMeta?.emoji} {tipoMeta?.label}
            </p>
          </div>
          <button onClick={handleGuardar} disabled={guardando}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-sm font-bold shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
            style={{ color: tipoMeta?.color || '#1b62cc' }}>
            {guardando
              ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <Save size={14} />}
            Guardar
          </button>
        </div>

        {/* Barra de progreso */}
        <div className="px-4 pb-4 relative">
          <div className="flex items-center justify-between text-xs text-white/70 mb-1.5">
            <span>{respondidos} de {items.length} ítems respondidos</span>
            <span className="font-bold text-white">{pct}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4 }} />
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4">

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-3 mb-4 bg-red-50 rounded-xl border border-red-100">
              <X size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </motion.div>
          )}

          {/* ── Datos generales ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4 space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Datos generales</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Empresa <span className="text-red-500">*</span></label>
                <select value={empresaId} onChange={e => { setEmpresaId(e.target.value); setPlanId('') }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Seleccionar…</option>
                  {empresas.map(e => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Fecha</label>
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Inspector <span className="text-red-500">*</span></label>
              <input type="text" value={inspector} onChange={e => setInspector(e.target.value)}
                placeholder="Nombre del inspector"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            {empresaId && actsFilt.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Vincular al PAT <span className="text-slate-400 font-normal">(se marcará como ejecutada)</span>
                </label>
                <select value={planId} onChange={e => setPlanId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Sin vincular</option>
                  {actsFilt.map(a => <option key={a.id} value={a.id}>{a.actividad}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* ── Foto ─────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Foto de evidencia <span className="text-slate-300 font-normal">(opcional)</span>
            </p>
            <input ref={fotoRef} type="file" accept="image/*" capture="environment"
              onChange={handleFoto} className="hidden" />
            {foto ? (
              <div className="relative">
                <img src={foto} alt="Evidencia"
                  className="w-full max-h-48 object-cover rounded-xl border border-slate-100" />
                <button onClick={() => setFoto(null)}
                  className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
                  <X size={14} className="text-slate-500" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fotoRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-slate-300 hover:bg-slate-50 transition-all">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Camera size={20} className="text-slate-400" />
                </div>
                <span className="text-xs font-semibold">Tomar o adjuntar foto</span>
              </button>
            )}
          </div>

          {/* ── Ítems ─────────────────────────────────────────────────────── */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ítems de inspección</p>
              <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded-full border border-slate-200">
                {respondidos}/{items.length}
              </span>
            </div>
            {items.map((item, i) => (
              <ItemInspeccion
                key={item.id} item={item} index={i}
                resultado={resultados[item.id]}
                accionTipo={acciones[item.id]?.tipo}
                accionDescripcion={acciones[item.id]?.descripcion}
                onChange={handleResultado}
                onAccion={handleAccion}
              />
            ))}
          </div>

          {/* ── Observación ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Observación general</p>
            <textarea value={observacion} onChange={e => setObservacion(e.target.value)}
              rows={3} placeholder="Observaciones adicionales de la inspección…"
              className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-slate-50" />
          </div>

          {/* ── Botón guardar ─────────────────────────────────────────────── */}
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleGuardar} disabled={guardando}
            className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 mb-8"
            style={{ background: tipoMeta ? `linear-gradient(135deg, ${tipoMeta.color}, ${tipoMeta.color}bb)` : 'linear-gradient(135deg,#1b62cc,#2563eb)', boxShadow: `0 8px 24px ${tipoMeta?.color || '#1b62cc'}40` }}
          >
            {guardando
              ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando…</>
              : <><Save size={18} /> Guardar inspección</>}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
