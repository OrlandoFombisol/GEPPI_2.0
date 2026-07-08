import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, CheckCircle2, XCircle, MinusCircle, Loader2, AlertTriangle, ChevronDown, ChevronUp, Flame } from 'lucide-react'
import { extintorDB, inspeccionDB } from '@/db'
import { BackButton } from '@/components/ui'

const ITEMS_EXTINTOR = [
  { id: 'A', label: 'Está ubicado en el lugar designado y accesible' },
  { id: 'B', label: 'Tiene señalización visible' },
  { id: 'C', label: 'El acceso se encuentra libre de obstáculos' },
  { id: 'D', label: 'Los precintos y sellos están colocados y en buen estado' },
  { id: 'E', label: 'El pasador de seguridad está en su lugar' },
  { id: 'F', label: 'La presión es correcta (manómetro en zona verde)' },
  { id: 'G', label: 'El manómetro se encuentra en buen estado' },
  { id: 'H', label: 'Manguera de descarga y boquilla en buen estado' },
  { id: 'I', label: 'Estado general del cilindro (sin golpes ni corrosión)' },
  { id: 'J', label: 'Tiene instrucciones de operación visibles' },
  { id: 'K', label: 'Tarjeta de inspección marcada y actualizada' },
  { id: 'L', label: 'Mango y palanca en buen estado' },
  { id: 'M', label: 'Válvula de operación en posición correcta' },
]

const RES = [
  { v: 'CUMPLE',    short: 'C',  active: 'bg-emerald-500 border-emerald-500 text-white' },
  { v: 'NO_CUMPLE', short: 'NC', active: 'bg-red-500 border-red-500 text-white' },
  { v: 'NO_APLICA', short: 'NA', active: 'bg-slate-500 border-slate-500 text-white' },
]
const IDLE = 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'

export default function InspeccionExtintoresForm({ empresas = [], usuarioId, onGuardado, onCancelar }) {
  const [empresaId,    setEmpresaId]    = useState('')
  const [sede,         setSede]         = useState('')
  const [sedeNueva,    setSedeNueva]    = useState('')
  const [sedes,        setSedes]        = useState([])
  const [mes,          setMes]          = useState(new Date().toISOString().slice(0, 7))
  const [inspector,    setInspector]    = useState('')
  const [extintores,   setExtintores]   = useState([])
  const [cargandoCat,  setCargandoCat]  = useState(false)
  const [resultados,   setResultados]   = useState({})
  const [guardando,    setGuardando]    = useState(false)
  const [error,        setError]        = useState('')
  const [showCatalogo, setShowCatalogo] = useState(false)
  const [showAddExt,   setShowAddExt]   = useState(false)
  const [nuevoTipo,    setNuevoTipo]    = useState('')
  const [nuevaUbic,    setNuevaUbic]    = useState('')
  const [agregando,    setAgregando]    = useState(false)

  const sedeActual = sede === '__nueva__' ? sedeNueva.trim() : sede

  // Load sedes when empresa changes
  useEffect(() => {
    setSedes([]); setSede(''); setExtintores([]); setResultados({})
    if (!empresaId) return
    extintorDB.getSedes(Number(empresaId)).then(s => {
      setSedes(s)
      if (s.length === 0) setSede('__nueva__')
    }).catch(console.error)
  }, [empresaId])

  // Load extintores when sede changes
  useEffect(() => {
    setExtintores([]); setResultados({})
    const s = sede === '__nueva__' ? sedeNueva.trim() : sede
    if (!empresaId || !s) return
    setCargandoCat(true)
    extintorDB.getBySede(Number(empresaId), s)
      .then(list => {
        setExtintores(list)
        setShowCatalogo(list.length === 0)
      })
      .catch(console.error)
      .finally(() => setCargandoCat(false))
  }, [sede, sedeNueva, empresaId])

  const recargarExtintores = async () => {
    if (!empresaId || !sedeActual) return
    const list = await extintorDB.getBySede(Number(empresaId), sedeActual)
    setExtintores(list)
  }

  const agregarExtintor = async () => {
    if (!sedeActual || !empresaId) return
    setAgregando(true)
    try {
      const nextNum = extintores.length > 0 ? Math.max(...extintores.map(e => e.numero)) + 1 : 1
      await extintorDB.create({
        empresaId: Number(empresaId),
        sede: sedeActual,
        numero: nextNum,
        tipo: nuevoTipo.trim() || null,
        ubicacion: nuevaUbic.trim() || null,
      })
      await recargarExtintores()
      if (!sedes.includes(sedeActual)) {
        setSedes(prev => [...new Set([...prev, sedeActual])].sort())
        setSede(sedeActual); setSedeNueva('')
      }
      setNuevoTipo(''); setNuevaUbic(''); setShowAddExt(false)
    } catch (e) { console.error(e) } finally { setAgregando(false) }
  }

  const eliminarExtintor = async (id) => {
    await extintorDB.remove(id)
    setExtintores(p => p.filter(e => e.id !== id))
    setResultados(p => { const n = { ...p }; delete n[id]; return n })
  }

  const setRes = (extId, itemId, val) =>
    setResultados(p => ({
      ...p,
      [extId]: { ...(p[extId] || {}), [itemId]: { ...((p[extId] || {})[itemId] || {}), resultado: val } }
    }))

  const setObs = (extId, itemId, obs) =>
    setResultados(p => ({
      ...p,
      [extId]: { ...(p[extId] || {}), [itemId]: { ...((p[extId] || {})[itemId] || {}), observacion: obs } }
    }))

  // Progress
  const totalItems  = extintores.length * ITEMS_EXTINTOR.length
  const respondidos = extintores.reduce((s, e) =>
    s + ITEMS_EXTINTOR.filter(item => resultados[e.id]?.[item.id]?.resultado).length, 0)
  const pct = totalItems > 0 ? Math.round(respondidos / totalItems * 100) : 0

  const handleGuardar = async () => {
    setError('')
    if (!empresaId)           return setError('Selecciona la empresa.')
    if (!sedeActual)          return setError('Indica la sede o punto de inspección.')
    if (!inspector.trim())    return setError('Ingresa el nombre del inspector.')
    if (extintores.length === 0) return setError('El catálogo está vacío. Agrega al menos un extintor.')
    for (const ext of extintores) {
      for (const item of ITEMS_EXTINTOR) {
        if (!resultados[ext.id]?.[item.id]?.resultado)
          return setError(`Faltan ítems por responder en el extintor #${ext.numero} (ítem ${item.id}).`)
      }
    }
    setGuardando(true)
    try {
      const itemsArray = extintores.map(ext => ({
        extintorId: ext.id,
        numero:     ext.numero,
        tipo:       ext.tipo,
        ubicacion:  ext.ubicacion,
        resultados: Object.fromEntries(ITEMS_EXTINTOR.map(item => [
          item.id,
          {
            resultado:   resultados[ext.id]?.[item.id]?.resultado  || 'NO_APLICA',
            observacion: resultados[ext.id]?.[item.id]?.observacion || '',
          }
        ]))
      }))
      await inspeccionDB.create({
        tipo:      'EXTINTORES',
        empresaId: Number(empresaId),
        sede:      sedeActual,
        fecha:     mes + '-15',
        inspector: inspector.trim(),
        items:     itemsArray,
        usuarioId: usuarioId || null,
      })
      onGuardado()
    } catch (err) {
      setError('Error al guardar: ' + err.message)
    } finally { setGuardando(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)' }} className="text-white px-4 py-4 sm:px-6 sticky top-0 z-10 shadow-md">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={onCancelar} className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/60 uppercase tracking-widest">Inspecciones SST</p>
              <h1 className="text-base font-black leading-tight">🧯 Inspección de Extintores</h1>
            </div>
            <button onClick={handleGuardar} disabled={guardando}
              className="flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl text-red-600 font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-60 flex-shrink-0">
              {guardando
                ? <span className="w-4 h-4 border-2 border-red-300 border-t-transparent rounded-full animate-spin" />
                : <Save size={13} />}
              Guardar
            </button>
          </div>
          {totalItems > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs text-white/70 flex-shrink-0 tabular-nums">{respondidos}/{totalItems}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 space-y-4">

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200 text-sm text-red-700 font-medium">
            <AlertTriangle size={14} className="flex-shrink-0" />{error}
          </div>
        )}

        {/* Setup */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Datos generales</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Empresa <span className="text-red-500">*</span></label>
              <select value={empresaId} onChange={e => setEmpresaId(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400">
                <option value="">Seleccionar…</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Sede / Punto de inspección <span className="text-red-500">*</span></label>
              {sedes.length > 0 ? (
                <select value={sede} onChange={e => setSede(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400">
                  <option value="">Seleccionar sede…</option>
                  {sedes.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="__nueva__">+ Nueva sede</option>
                </select>
              ) : (
                <input type="text" value={sedeNueva} onChange={e => setSedeNueva(e.target.value)}
                  placeholder="Nombre de la sede (ej. Granabastos)"
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400" />
              )}
              {sede === '__nueva__' && (
                <input type="text" value={sedeNueva} onChange={e => setSedeNueva(e.target.value)}
                  placeholder="Nombre de la nueva sede"
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 mt-1.5" />
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Mes de inspección <span className="text-red-500">*</span></label>
              <input type="month" value={mes} onChange={e => setMes(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Inspector <span className="text-red-500">*</span></label>
              <input type="text" value={inspector} onChange={e => setInspector(e.target.value)}
                placeholder="Nombre del inspector"
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400" />
            </div>

          </div>
        </div>

        {/* Catálogo */}
        {(sedeActual || sede === '__nueva__') && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <button onClick={() => setShowCatalogo(p => !p)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors">
              <Flame size={16} className="text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">Catálogo de extintores</p>
                <p className="text-xs text-slate-500">
                  {cargandoCat ? 'Cargando…'
                    : sedeActual
                    ? `${extintores.length} extintor${extintores.length !== 1 ? 'es' : ''} registrados${sedeActual ? ` — ${sedeActual}` : ''}`
                    : 'Indica la sede para cargar el catálogo'}
                </p>
              </div>
              {showCatalogo ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
            </button>

            {showCatalogo && (
              <div className="border-t border-slate-100 p-5 space-y-3">
                {cargandoCat ? (
                  <div className="flex items-center justify-center gap-2 text-slate-400 py-6">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Cargando catálogo…</span>
                  </div>
                ) : (
                  <>
                    {extintores.length === 0 && !showAddExt && (
                      <p className="text-sm text-slate-400 text-center py-2">
                        No hay extintores registrados para esta sede. Agrega el primero.
                      </p>
                    )}

                    {extintores.map(ext => (
                      <div key={ext.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 text-sm font-black flex items-center justify-center flex-shrink-0">
                          {ext.numero}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{ext.tipo || 'Sin tipo'}</p>
                          {ext.ubicacion && <p className="text-xs text-slate-500 truncate">{ext.ubicacion}</p>}
                        </div>
                        <button onClick={() => eliminarExtintor(ext.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}

                    {showAddExt ? (
                      <div className="border border-red-100 rounded-xl p-4 bg-red-50 space-y-2">
                        <p className="text-xs font-bold text-red-700 mb-2">Nuevo extintor #{extintores.length + 1}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-slate-600 block mb-1">Tipo</label>
                            <input type="text" value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value)}
                              placeholder="CO2, PQS, Agua…"
                              className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-red-400" />
                          </div>
                          <div>
                            <label className="text-xs text-slate-600 block mb-1">Ubicación</label>
                            <input type="text" value={nuevaUbic} onChange={e => setNuevaUbic(e.target.value)}
                              placeholder="Bodega, entrada…"
                              className="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-red-400" />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end pt-1">
                          <button onClick={() => { setShowAddExt(false); setNuevoTipo(''); setNuevaUbic('') }}
                            className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                            Cancelar
                          </button>
                          <button onClick={agregarExtintor} disabled={agregando}
                            className="px-3 py-1.5 text-xs text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-60 flex items-center gap-1 transition-colors">
                            {agregando ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            Agregar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setShowAddExt(true)}
                        className="w-full py-2.5 border-2 border-dashed border-red-200 rounded-xl text-red-500 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
                        <Plus size={14} /> Agregar extintor
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Inspection items per extinguisher */}
        {extintores.length > 0 && (
          <>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 pt-1">
              Formulario de inspección — {extintores.length} extintor{extintores.length !== 1 ? 'es' : ''}
            </p>

            {extintores.map(ext => {
              const extRes = resultados[ext.id] || {}
              const respondidosExt = ITEMS_EXTINTOR.filter(i => extRes[i.id]?.resultado).length
              const allDone = respondidosExt === ITEMS_EXTINTOR.length

              return (
                <div key={ext.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className={`flex items-center gap-3 px-5 py-3 border-b ${allDone ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="w-9 h-9 rounded-full bg-red-500 text-white text-sm font-black flex items-center justify-center flex-shrink-0">
                      {ext.numero}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800">
                        Extintor #{ext.numero} — {ext.tipo || 'Sin tipo'}
                      </p>
                      {ext.ubicacion && <p className="text-xs text-slate-500 truncate">{ext.ubicacion}</p>}
                    </div>
                    {allDone
                      ? <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                      : <span className="text-xs text-slate-400 flex-shrink-0 tabular-nums">{respondidosExt}/{ITEMS_EXTINTOR.length}</span>
                    }
                  </div>

                  <div className="p-4 space-y-3">
                    {ITEMS_EXTINTOR.map(item => {
                      const cur = extRes[item.id] || {}
                      return (
                        <div key={item.id}>
                          <div className="flex items-start gap-2 mb-1.5">
                            <span className="flex-shrink-0 w-6 h-5 bg-red-50 text-red-600 text-xs font-black rounded flex items-center justify-center mt-0.5">
                              {item.id}
                            </span>
                            <p className="text-xs text-slate-700 leading-snug flex-1">{item.label}</p>
                          </div>
                          <div className="flex gap-1.5 ml-8">
                            {RES.map(r => (
                              <button key={r.v} type="button"
                                onClick={() => setRes(ext.id, item.id, r.v)}
                                className={['flex-1 py-1.5 rounded-lg border-2 text-xs font-bold transition-all', cur.resultado === r.v ? r.active : IDLE].join(' ')}>
                                {r.short}
                              </button>
                            ))}
                          </div>
                          {cur.resultado === 'NO_CUMPLE' && (
                            <textarea
                              value={cur.observacion || ''}
                              onChange={e => setObs(ext.id, item.id, e.target.value)}
                              placeholder="Observación (qué se encontró)…"
                              rows={1}
                              className="mt-1.5 ml-8 w-[calc(100%-2rem)] text-xs px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Bottom save */}
            <div className="pb-10">
              <button onClick={handleGuardar} disabled={guardando}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:opacity-90 active:scale-[0.99] shadow-sm"
                style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)' }}>
                {guardando
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando…</>
                  : <><Save size={16} />Guardar inspección de extintores</>}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
