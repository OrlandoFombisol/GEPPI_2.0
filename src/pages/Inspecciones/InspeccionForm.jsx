import { useState, useRef } from 'react'
import { Camera, X, ChevronLeft, Save, CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import { inspeccionDB, planTrabajoDB } from '@/db'
import { Button, AlertBanner } from '@/components/ui'
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
  { value: 'CUMPLE',    label: 'Cumple',    Icon: CheckCircle2, cls: 'border-green-400  bg-green-50  text-green-700',  active: 'bg-green-600  text-white border-green-600'  },
  { value: 'NO_CUMPLE', label: 'No cumple', Icon: XCircle,      cls: 'border-red-400    bg-red-50    text-red-700',    active: 'bg-red-600    text-white border-red-600'    },
  { value: 'NO_APLICA', label: 'No aplica', Icon: MinusCircle,  cls: 'border-slate-300  bg-slate-50  text-slate-500',  active: 'bg-slate-500  text-white border-slate-500'  },
]

const ACCION_TIPOS = ['CORRECTIVA', 'PREVENTIVA', 'MEJORA']

function ItemInspeccion({ item, resultado, accionTipo, accionDescripcion, onChange, onAccion }) {
  return (
    <div className="py-4 border-b border-slate-100 last:border-0">
      <p className="text-sm font-medium text-slate-800 mb-2.5">{item.label}</p>
      <div className="flex gap-2">
        {RESULTADO_CFG.map(({ value, label, cls, active }) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(item.id, value)}
            className={[
              'flex-1 py-2 px-1 rounded-xl text-xs font-semibold border transition-all',
              resultado === value ? active : cls,
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {resultado === 'NO_CUMPLE' && (
        <div className="mt-3 space-y-2 pl-1">
          <div className="flex gap-2">
            {ACCION_TIPOS.map(tipo => (
              <button
                key={tipo}
                type="button"
                onClick={() => onAccion(item.id, 'tipo', tipo)}
                className={[
                  'flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all',
                  accionTipo === tipo
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
                ].join(' ')}
              >
                {tipo}
              </button>
            ))}
          </div>
          <textarea
            value={accionDescripcion || ''}
            onChange={e => onAccion(item.id, 'descripcion', e.target.value)}
            rows={2}
            placeholder="Describa la acción a implementar…"
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>
      )}
    </div>
  )
}

export default function InspeccionForm({ empresas = [], actividadesPAT = [], usuarioId, onGuardado, onCancelar }) {
  const [tipo,       setTipo]       = useState('')
  const [empresaId,  setEmpresaId]  = useState('')
  const [fecha,      setFecha]      = useState(new Date().toISOString().slice(0, 10))
  const [inspector,  setInspector]  = useState('')
  const [planId,     setPlanId]     = useState('')
  const [foto,       setFoto]       = useState(null)
  const [resultados, setResultados] = useState({})
  const [acciones,   setAcciones]   = useState({})
  const [observacion,setObservacion]= useState('')
  const [guardando,  setGuardando]  = useState(false)
  const [error,      setError]      = useState('')
  const fotoRef = useRef(null)

  const items     = tipo ? (ITEMS_POR_TIPO[tipo] || []) : []
  const tipoMeta  = TIPOS_INSPECCION.find(t => t.value === tipo)
  const respondidos = items.filter(i => resultados[i.id]).length
  const pct       = items.length > 0 ? Math.round((respondidos / items.length) * 100) : 0

  const actsFiltradas = actividadesPAT.filter(a =>
    (!empresaId || String(a.empresaId) === String(empresaId)) &&
    a.estado === 'PENDIENTE'
  )

  const handleResultado = (id, valor) =>
    setResultados(p => ({ ...p, [id]: valor }))

  const handleAccion = (id, campo, valor) =>
    setAcciones(p => ({ ...p, [id]: { ...p[id], [campo]: valor } }))

  const handleFoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try { setFoto(await comprimirFoto(file)) }
    catch { setError('No se pudo procesar la foto.') }
  }

  const handleGuardar = async () => {
    setError('')
    if (!tipo)           return setError('Selecciona el tipo de inspección.')
    if (!empresaId)      return setError('Selecciona la empresa.')
    if (!inspector.trim()) return setError('Ingresa el nombre del inspector.')
    if (respondidos < items.length)
      return setError(`Responde todos los ítems (${respondidos}/${items.length} completados).`)

    setGuardando(true)
    try {
      const itemsArray = items.map(item => ({
        id:                item.id,
        label:             item.label,
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

      // Marcar actividad del PAT como ejecutada si fue vinculada
      if (planId) {
        await planTrabajoDB.update(Number(planId), { estado: 'EJECUTADO' })
      }

      onGuardado(inspeccionId)
    } catch (err) {
      setError('Error al guardar: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white flex-shrink-0">
        <button onClick={onCancelar} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">
            {tipoMeta ? `${tipoMeta.emoji} Inspección de ${tipoMeta.label}` : 'Nueva Inspección'}
          </p>
          {items.length > 0 && (
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-slate-400 flex-shrink-0">{respondidos}/{items.length}</span>
            </div>
          )}
        </div>
        <Button onClick={handleGuardar} loading={guardando} size="sm">
          <Save size={14} className="mr-1.5" /> Guardar
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-5">

          {error && <AlertBanner level="danger" message={error} />}

          {/* Datos generales */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Datos generales</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Tipo <span className="text-red-500">*</span></label>
                <select value={tipo} onChange={e => { setTipo(e.target.value); setResultados({}) }}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Seleccionar…</option>
                  {TIPOS_INSPECCION.map(t => (
                    <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Fecha</label>
                <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Empresa <span className="text-red-500">*</span></label>
              <select value={empresaId} onChange={e => { setEmpresaId(e.target.value); setPlanId('') }}
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Seleccionar empresa…</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Inspector <span className="text-red-500">*</span></label>
              <input type="text" value={inspector} onChange={e => setInspector(e.target.value)}
                placeholder="Nombre del inspector"
                className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            {empresaId && actsFiltradas.length > 0 && (
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Actividad del Plan de Trabajo <span className="text-xs text-slate-400">(opcional — se marcará como ejecutada)</span>
                </label>
                <select value={planId} onChange={e => setPlanId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Sin vincular al PAT</option>
                  {actsFiltradas.map(a => (
                    <option key={a.id} value={a.id}>{a.actividad}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Foto */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
              Foto de evidencia <span className="text-slate-400 font-normal">(opcional)</span>
            </p>
            <input ref={fotoRef} type="file" accept="image/*" capture="environment"
              onChange={handleFoto} className="hidden" />
            {foto ? (
              <div className="relative">
                <img src={foto} alt="Evidencia" className="w-full max-h-52 object-cover rounded-xl border border-slate-200" />
                <button onClick={() => setFoto(null)}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow">
                  <X size={14} className="text-slate-600" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fotoRef.current?.click()}
                className="w-full h-24 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-primary-400 hover:text-primary-600 transition-colors">
                <Camera size={24} />
                <span className="text-xs font-medium">Tomar o adjuntar foto</span>
              </button>
            )}
          </div>

          {/* Ítems */}
          {tipo && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
                {tipoMeta?.emoji} Ítems de inspección
              </p>
              <p className="text-xs text-slate-400 mb-3">
                Selecciona el resultado para cada ítem. Si es "No cumple", describe la acción a implementar.
              </p>
              {items.map(item => (
                <ItemInspeccion
                  key={item.id}
                  item={item}
                  resultado={resultados[item.id]}
                  accionTipo={acciones[item.id]?.tipo}
                  accionDescripcion={acciones[item.id]?.descripcion}
                  onChange={handleResultado}
                  onAccion={handleAccion}
                />
              ))}
            </div>
          )}

          {/* Observación general */}
          {tipo && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Observación general</p>
              <textarea value={observacion} onChange={e => setObservacion(e.target.value)}
                rows={3} placeholder="Observaciones adicionales de la inspección…"
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
            </div>
          )}

          <div className="pb-8">
            <Button onClick={handleGuardar} loading={guardando} className="w-full">
              <Save size={16} className="mr-2" /> Guardar inspección
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
