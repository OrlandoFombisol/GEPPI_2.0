import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, Save, CheckCircle2, XCircle, MinusCircle, ChevronRight, ChevronLeft } from 'lucide-react'
import { inspeccionDB, planTrabajoDB } from '@/db'
import { TIPOS_INSPECCION, ITEMS_POR_TIPO } from './items'

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

const RESULTADO_CFG = [
  { value: 'CUMPLE',    label: 'Cumple',    Icon: CheckCircle2, idle: 'border-slate-200 bg-white text-slate-500',  active: 'border-emerald-500 bg-emerald-500 text-white' },
  { value: 'NO_CUMPLE', label: 'No cumple', Icon: XCircle,      idle: 'border-slate-200 bg-white text-slate-500',  active: 'border-red-500     bg-red-500     text-white' },
  { value: 'NO_APLICA', label: 'N/A',       Icon: MinusCircle,  idle: 'border-slate-200 bg-white text-slate-400',  active: 'border-slate-500   bg-slate-500   text-white' },
]
const ACCION_TIPOS = ['CORRECTIVA', 'PREVENTIVA', 'MEJORA']

// ── Ítem con botones táctiles ─────────────────────────────────────────────────
function ItemInspeccion({ item, resultado, accionTipo, accionDescripcion, onChange, onAccion, index }) {
  return (
    <div className="border-b border-slate-100 last:border-0 py-3">
      <div className="flex items-start gap-2 mb-2.5">
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-400 text-xs font-bold flex items-center justify-center mt-0.5">
          {index + 1}
        </span>
        <p className="text-sm font-medium text-slate-800 leading-snug">{item.label}</p>
      </div>
      <div className="grid grid-cols-3 gap-1.5 ml-7">
        {RESULTADO_CFG.map(({ value, label, Icon, idle, active }) => (
          <button key={value} type="button" onClick={() => onChange(item.id, value)}
            className={['flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all font-semibold text-xs', resultado === value ? active : idle].join(' ')}>
            <Icon size={16} strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>
      <AnimatePresence>
        {resultado === 'NO_CUMPLE' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden ml-7">
            <div className="mt-2.5 pt-2.5 border-t border-red-100 space-y-2">
              <p className="text-xs font-semibold text-red-600">Acción a implementar:</p>
              <div className="flex gap-1.5">
                {ACCION_TIPOS.map(tipo => (
                  <button key={tipo} type="button" onClick={() => onAccion(item.id, 'tipo', tipo)}
                    className={['flex-1 py-1.5 text-xs font-bold rounded-lg border-2 transition-all',
                      accionTipo === tipo ? 'bg-orange-500 border-orange-500 text-white' : 'bg-orange-50 border-orange-200 text-orange-700'].join(' ')}>
                    {tipo}
                  </button>
                ))}
              </div>
              <textarea value={accionDescripcion || ''} rows={2}
                onChange={e => onAccion(item.id, 'descripcion', e.target.value)}
                placeholder="Describa la acción…"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-slate-50" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Componente exportado ─────────────────────────────────────────────────────
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

  const handleResultado = (id, valor) => setResultados(p => ({ ...p, [id]: valor }))
  const handleAccion    = (id, campo, valor) => setAcciones(p => ({ ...p, [id]: { ...p[id], [campo]: valor } }))
  const handleFoto      = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    try { setFoto(await comprimirFoto(file)) } catch { setError('No se pudo procesar la foto.') }
  }
  const handleGuardar = async () => {
    setError('')
    if (!tipo)             return setError('Selecciona el tipo de inspección.')
    if (!empresaId)        return setError('Selecciona la empresa.')
    if (!inspector.trim()) return setError('Ingresa el nombre del inspector.')
    if (respondidos < items.length)
      return setError(`Responde todos los ítems (${respondidos}/${items.length}).`)
    setGuardando(true)
    try {
      const itemsArray = items.map(item => ({
        id: item.id, label: item.label,
        resultado:         resultados[item.id],
        accionTipo:        acciones[item.id]?.tipo        || null,
        accionDescripcion: acciones[item.id]?.descripcion || null,
      }))
      const id = await inspeccionDB.create({
        tipo, empresaId: Number(empresaId), fecha,
        inspector: inspector.trim(), items: itemsArray,
        fotoBase64: foto || null,
        observacionGeneral: observacion.trim() || null,
        planTrabajoId: planId ? Number(planId) : null,
        usuarioId: usuarioId || null,
      })
      if (planId) await planTrabajoDB.update(Number(planId), { estado: 'EJECUTADO' })
      onGuardado(id)
    } catch (err) {
      setError('Error al guardar: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 sm:items-center overflow-y-auto"
      style={{ background: 'rgba(15,30,60,0.60)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancelar() }}>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 32px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera dinámica */}
        <div className="relative overflow-hidden"
          style={{ background: tipo && tipoMeta ? `linear-gradient(135deg,${tipoMeta.color}dd,${tipoMeta.color}88)` : 'linear-gradient(135deg,#0f2d6e,#1b62cc)' }}>
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle,#fff,transparent)' }} />
          <div className="flex items-center gap-3 px-5 py-4">
            {tipo ? (
              <button onClick={() => { setTipo(''); setResultados({}) }}
                className="p-1.5 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-colors flex-shrink-0">
                <ChevronLeft size={16} />
              </button>
            ) : (
              <button onClick={onCancelar}
                className="p-1.5 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-colors flex-shrink-0">
                <X size={16} />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-white leading-tight">
                {tipo ? `${tipoMeta?.emoji} Inspección de ${tipoMeta?.label}` : 'Nueva Inspección'}
              </p>
              {tipo && items.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-white rounded-full"
                      animate={{ width: `${pct}%` }} transition={{ duration: 0.35 }} />
                  </div>
                  <span className="text-xs text-white/70 flex-shrink-0">{respondidos}/{items.length}</span>
                </div>
              )}
            </div>
            {tipo && (
              <button onClick={handleGuardar} disabled={guardando}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-60 flex-shrink-0"
                style={{ color: tipoMeta?.color || '#1b62cc' }}>
                {guardando
                  ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <Save size={13} />}
                Guardar
              </button>
            )}
          </div>
        </div>

        {/* Cuerpo scrollable */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>

          {/* PASO 1 — Selector de tipo */}
          {!tipo && (
            <div className="p-5 space-y-2">
              <p className="text-xs text-slate-500 mb-3">Selecciona el tipo de inspección a realizar:</p>
              {TIPOS_INSPECCION.map((meta, i) => (
                <motion.button
                  key={meta.value}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setTipo(meta.value); setResultados({}) }}
                  className="flex items-center gap-4 w-full p-3.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-left"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${meta.color}15`, border: `2px solid ${meta.color}30` }}>
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800">{meta.label}</p>
                    <p className="text-xs text-slate-400">{ITEMS_POR_TIPO[meta.value]?.length || 0} ítems</p>
                  </div>
                  <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />
                </motion.button>
              ))}
            </div>
          )}

          {/* PASO 2 — Formulario */}
          {tipo && (
            <div className="p-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-700 font-medium">
                  <X size={13} className="flex-shrink-0" />{error}
                </div>
              )}

              {/* Datos generales */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Datos generales</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Empresa <span className="text-red-500">*</span></label>
                    <select value={empresaId} onChange={e => { setEmpresaId(e.target.value); setPlanId('') }}
                      className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Seleccionar…</option>
                      {empresas.map(e => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Fecha</label>
                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Inspector <span className="text-red-500">*</span></label>
                  <input type="text" value={inspector} onChange={e => setInspector(e.target.value)}
                    placeholder="Nombre del inspector"
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                {empresaId && actsFilt.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">
                      Vincular al PAT <span className="text-slate-400 font-normal">(se marcará como ejecutada)</span>
                    </label>
                    <select value={planId} onChange={e => setPlanId(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Sin vincular</option>
                      {actsFilt.map(a => <option key={a.id} value={a.id}>{a.actividad}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Foto */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Foto de evidencia <span className="text-slate-300 font-normal">(opcional)</span>
                </p>
                <input ref={fotoRef} type="file" accept="image/*" capture="environment"
                  onChange={handleFoto} className="hidden" />
                {foto ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    <img src={foto} alt="Evidencia" className="w-full max-h-40 object-cover" />
                    <button onClick={() => setFoto(null)}
                      className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center">
                      <X size={13} className="text-slate-500" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fotoRef.current?.click()}
                    className="w-full h-20 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:border-slate-300 hover:bg-slate-50 transition-all">
                    <Camera size={18} />
                    <span className="text-xs font-semibold">Tomar o adjuntar foto</span>
                  </button>
                )}
              </div>

              {/* Ítems */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ítems de inspección</p>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{respondidos}/{items.length}</span>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 px-4 divide-y divide-slate-100">
                  {items.map((item, i) => (
                    <ItemInspeccion key={item.id} item={item} index={i}
                      resultado={resultados[item.id]}
                      accionTipo={acciones[item.id]?.tipo}
                      accionDescripcion={acciones[item.id]?.descripcion}
                      onChange={handleResultado} onAccion={handleAccion} />
                  ))}
                </div>
              </div>

              {/* Observación */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Observación general</p>
                <textarea value={observacion} onChange={e => setObservacion(e.target.value)} rows={3}
                  placeholder="Observaciones adicionales…"
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-slate-50" />
              </div>

              {/* Botón guardar */}
              <button onClick={handleGuardar} disabled={guardando}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:opacity-90 active:scale-[0.99]"
                style={{ background: tipoMeta ? `linear-gradient(135deg,${tipoMeta.color},${tipoMeta.color}cc)` : 'linear-gradient(135deg,#1b62cc,#2563eb)' }}>
                {guardando
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando…</>
                  : <><Save size={16} />Guardar inspección</>}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
