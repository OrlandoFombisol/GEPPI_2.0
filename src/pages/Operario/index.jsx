import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence }      from 'framer-motion'
import { Camera, CheckCircle2, XCircle, AlertCircle, ChevronRight, CheckCheck, Car } from 'lucide-react'
import { supabase }  from '@/lib/supabase'
import { toDB }      from '@/lib/mappers'

const logoPng = '/logo.jpg'

// ─── Items del checklist (mismo que ChecklistForm) ────────────────────────────
const ITEMS_CHECKLIST = [
  { id: 'estado_general',      grupo: 'General',     label: 'Estado general del vehículo' },
  { id: 'limpieza',            grupo: 'General',     label: 'Limpieza interior y exterior' },
  { id: 'luces_delanteras',    grupo: 'Iluminación', label: 'Luces delanteras (alta y baja)' },
  { id: 'luces_traseras',      grupo: 'Iluminación', label: 'Luces traseras y de reversa' },
  { id: 'direccionales',       grupo: 'Iluminación', label: 'Direccionales / pitos' },
  { id: 'frenos_pie',          grupo: 'Frenos',      label: 'Freno de pie (principal)' },
  { id: 'freno_mano',          grupo: 'Frenos',      label: 'Freno de mano (estacionamiento)' },
  { id: 'freno_aire',          grupo: 'Frenos',      label: 'Freno de aire' },
  { id: 'llanta_delantera_i',  grupo: 'Llantas',     label: 'Llanta delantera izquierda' },
  { id: 'llanta_delantera_d',  grupo: 'Llantas',     label: 'Llanta delantera derecha' },
  { id: 'llanta_trasera_i',    grupo: 'Llantas',     label: 'Llanta trasera izquierda' },
  { id: 'llanta_trasera_d',    grupo: 'Llantas',     label: 'Llanta trasera derecha' },
  { id: 'llanta_repuesto',     grupo: 'Llantas',     label: 'Llanta de repuesto' },
  { id: 'espejo_retrovisor',   grupo: 'Visibilidad', label: 'Espejo retrovisor central' },
  { id: 'espejo_izquierdo',    grupo: 'Visibilidad', label: 'Espejo lateral izquierdo' },
  { id: 'espejo_derecho',      grupo: 'Visibilidad', label: 'Espejo lateral derecho' },
  { id: 'vidrios',             grupo: 'Visibilidad', label: 'Vidrios (sin grietas/roturas)' },
  { id: 'cinturon_conductor',  grupo: 'Seguridad',   label: 'Cinturón de seguridad conductor' },
  { id: 'cinturon_pasajeros',  grupo: 'Seguridad',   label: 'Cinturones de pasajeros' },
  { id: 'extintor',            grupo: 'Seguridad',   label: 'Extintor (vigente y cargado)' },
  { id: 'botiquin',            grupo: 'Seguridad',   label: 'Botiquín de primeros auxilios' },
  { id: 'kit_carretera',       grupo: 'Seguridad',   label: 'Kit de carretera (señales, chaleco)' },
  { id: 'aceite_motor',        grupo: 'Fluidos',     label: 'Nivel de aceite del motor' },
  { id: 'agua_radiador',       grupo: 'Fluidos',     label: 'Nivel de agua / líquido refrigerante' },
  { id: 'liquido_frenos',      grupo: 'Fluidos',     label: 'Nivel de líquido de frenos' },
  { id: 'combustible',         grupo: 'Fluidos',     label: 'Nivel de combustible' },
  { id: 'soat',                grupo: 'Documentos',  label: 'SOAT vigente' },
  { id: 'tecnicomecanica',     grupo: 'Documentos',  label: 'Revisión técnico-mecánica vigente' },
  { id: 'tarjeta_propiedad',   grupo: 'Documentos',  label: 'Tarjeta de propiedad / circulación' },
  { id: 'licencia_conduccion', grupo: 'Documentos',  label: 'Licencia de conducción vigente' },
]

const ESTADOS = [
  { value: 'BUENO',   label: 'Bueno',   Icon: CheckCircle2, idle: 'border-slate-200 bg-white text-slate-500',   active: 'border-green-500 bg-green-500 text-white' },
  { value: 'REGULAR', label: 'Regular', Icon: AlertCircle,  idle: 'border-slate-200 bg-white text-slate-500',   active: 'border-yellow-500 bg-yellow-500 text-white' },
  { value: 'MALO',    label: 'Malo',    Icon: XCircle,      idle: 'border-slate-200 bg-white text-slate-500',   active: 'border-red-500 bg-red-500 text-white' },
  { value: 'N/A',     label: 'N/A',     Icon: null,         idle: 'border-slate-200 bg-white text-slate-400',   active: 'border-slate-500 bg-slate-500 text-white' },
]

const GRUPOS = [...new Set(ITEMS_CHECKLIST.map(i => i.grupo))]

// ─── Ítem individual ──────────────────────────────────────────────────────────
function ItemRow({ item, valor, observacion, onCambio, onObservacion }) {
  return (
    <div className="py-3 border-b border-slate-100 last:border-0 space-y-2">
      <span className="text-sm text-slate-800 font-medium leading-snug block">{item.label}</span>
      <div className="flex gap-1.5">
        {ESTADOS.map(({ value, label, Icon, idle, active }) => (
          <button key={value} type="button"
            onClick={() => onCambio(item.id, value)}
            className={['flex-1 py-2 rounded-lg text-[11px] font-bold border-2 transition-all flex items-center justify-center gap-1', valor === value ? active : idle].join(' ')}
          >
            {Icon && <Icon size={11} />}
            {label}
          </button>
        ))}
      </div>
      {(valor === 'MALO' || valor === 'REGULAR') && (
        <input type="text" value={observacion || ''} onChange={e => onObservacion(item.id, e.target.value)}
          placeholder="Describir hallazgo…"
          className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Operario() {
  const [paso,         setPaso]         = useState('auth') // auth | checklist | exito
  const [empresas,     setEmpresas]     = useState([])
  const [trabajadores, setTrabajadores] = useState([])
  const [empresaId,    setEmpresaId]    = useState('')
  const [trabajadorId, setTrabajadorId] = useState('')
  const [cedula,       setCedula]       = useState('')
  const [conductor,    setConductor]    = useState(null)
  const [cargando,     setCargando]     = useState(false)
  const [errorAuth,    setErrorAuth]    = useState('')
  const [errorEmpresas, setErrorEmpresas] = useState(false)

  // Checklist state
  const today = new Date().toISOString().slice(0, 10)
  const [fecha,        setFecha]        = useState(today)
  const [placa,        setPlaca]        = useState('')
  const [vehiculoTipo, setVehiculoTipo] = useState('')
  const [items,        setItems]        = useState({})
  const [obs,          setObs]          = useState({})
  const [obsGeneral,   setObsGeneral]   = useState('')
  const [foto,         setFoto]         = useState(null)
  const [guardando,    setGuardando]    = useState(false)
  const [errorForm,    setErrorForm]    = useState('')
  const fotoRef = useRef()

  // Cargar empresas al montar
  useEffect(() => {
    supabase.from('empresa').select('id, razon_social').eq('estado', 'ACTIVO').order('razon_social')
      .then(({ data, error }) => {
        if (error || !data?.length) setErrorEmpresas(true)
        setEmpresas(data || [])
      })
  }, [])

  // Cargar trabajadores al seleccionar empresa — solo conductores (cargo 64=CONDUCTOR I, 65=CONDUCTOR II)
  useEffect(() => {
    if (!empresaId) { setTrabajadores([]); setTrabajadorId(''); return }
    supabase.from('trabajador').select('id, nombres, apellidos')
      .eq('empresa_id', Number(empresaId)).eq('estado', 'ACTIVO')
      .in('cargo_id', [64, 65])
      .order('apellidos')
      .then(({ data }) => setTrabajadores(data || []))
  }, [empresaId])

  const validar = async () => {
    if (!empresaId)     return setErrorAuth('Selecciona tu empresa.')
    if (!trabajadorId)  return setErrorAuth('Selecciona tu nombre.')
    if (!cedula.trim()) return setErrorAuth('Ingresa tu número de cédula.')
    setErrorAuth(''); setCargando(true)
    try {
      const { data, error } = await supabase
        .from('trabajador')
        .select('id, nombres, apellidos, cargo_id')
        .eq('id', Number(trabajadorId))
        .eq('empresa_id', Number(empresaId))
        .eq('cedula', String(cedula.trim()))
        .in('cargo_id', [64, 65])
        .single()
      if (error || !data) {
        setErrorAuth('Cédula incorrecta. Verifica tus datos o consulta con tu SISO.')
        return
      }
      setConductor(data)
      setPaso('checklist')
    } catch {
      setErrorAuth('Error de conexión. Intenta nuevamente.')
    } finally {
      setCargando(false)
    }
  }

  const handleFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setFoto(ev.target.result)
    reader.readAsDataURL(file)
  }

  const marcarTodoBueno = () => {
    const todas = {}
    ITEMS_CHECKLIST.forEach(i => { todas[i.id] = 'BUENO' })
    setItems(todas)
  }

  const totalRespondidos = ITEMS_CHECKLIST.filter(i => items[i.id]).length

  const enviar = async () => {
    setErrorForm('')
    if (!placa.trim())       return setErrorForm('Ingresa la placa del vehículo.')
    if (!vehiculoTipo)       return setErrorForm('Selecciona el tipo de vehículo.')
    if (!foto)               return setErrorForm('La foto del vehículo es obligatoria.')
    if (totalRespondidos < Math.ceil(ITEMS_CHECKLIST.length * 0.7))
      return setErrorForm(`Completa al menos el 70% del checklist (${Math.ceil(ITEMS_CHECKLIST.length * 0.7)} ítems).`)

    setGuardando(true)
    try {
      const itemsArray = ITEMS_CHECKLIST.map(item => ({
        id:          item.id,
        grupo:       item.grupo,
        label:       item.label,
        estado:      items[item.id] || 'N/A',
        observacion: obs[item.id] || '',
      }))

      const payload = toDB({
        fecha,
        empresaId:          Number(empresaId),
        vehiculoPlaca:      placa.trim().toUpperCase(),
        vehiculoTipo,
        conductorNombre:    `${conductor.nombres} ${conductor.apellidos}`,
        conductorCedula:    cedula.trim(),
        items:              itemsArray,
        observacionGeneral: obsGeneral.trim(),
        fotoBase64:         foto,
        fotoFecha:          new Date().toISOString(),
      })

      const { error } = await supabase.from('checklist_preoperacional').insert(payload)
      if (error) throw error
      setPaso('exito')
    } catch (e) {
      setErrorForm(`Error al enviar: ${e.message}`)
    } finally {
      setGuardando(false)
    }
  }

  const reiniciar = () => {
    setPaso('auth'); setConductor(null); setCedula(''); setTrabajadorId('')
    setPlaca(''); setVehiculoTipo(''); setItems({}); setObs({}); setObsGeneral(''); setFoto(null)
    setErrorForm(''); setErrorAuth('')
  }

  const empresaNombre = empresas.find(e => e.id === Number(empresaId))?.razon_social || ''

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ colorScheme: 'light', color: '#0f172a' }}>

      {/* Header compacto */}
      <div style={{ background: 'linear-gradient(135deg,#083278,#1B62CC)', padding: '14px 20px' }}
        className="flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0"
          style={{ padding: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
          <img src={logoPng} alt="GEPPI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'white', letterSpacing: '0.08em' }}>GEPPI</p>
          <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>Checklist Preoperacional</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Car size={14} color="rgba(255,255,255,0.6)" />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>ACCESO OPERARIO</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ── PASO 1: AUTENTICACIÓN ─────────────────────────────────────── */}
          {paso === 'auth' && (
            <motion.div key="auth"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="max-w-md mx-auto p-5 space-y-5 pt-8"
            >
              <div className="text-center space-y-1">
                <h1 className="text-xl font-bold text-slate-900">Bienvenido</h1>
                <p className="text-sm text-slate-500">Identifícate para continuar con el checklist</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">

                {/* Empresa */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                    Empresa <span className="text-red-500">*</span>
                  </label>
                  <select value={empresaId} onChange={e => { setEmpresaId(e.target.value); setTrabajadorId('') }}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ colorScheme: 'light' }}>
                    <option value="">Seleccionar empresa…</option>
                    {empresas.map(e => <option key={e.id} value={e.id} style={{ color: '#0f172a', background: '#fff' }}>{e.razon_social}</option>)}
                  </select>
                  {errorEmpresas && (
                    <p className="text-xs text-red-600 mt-1">
                      No se pudo cargar la lista. Verifica tu conexión e intenta recargar la página.
                    </p>
                  )}
                </div>

                {/* Nombre */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                    Tu nombre <span className="text-red-500">*</span>
                  </label>
                  <select value={trabajadorId} onChange={e => setTrabajadorId(e.target.value)}
                    disabled={!empresaId}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    style={{ colorScheme: 'light' }}>
                    <option value="">{empresaId ? 'Seleccionar nombre…' : 'Primero selecciona empresa'}</option>
                    {trabajadores.map(t => (
                      <option key={t.id} value={t.id} style={{ color: '#0f172a', background: '#fff' }}>{t.apellidos} {t.nombres}</option>
                    ))}
                  </select>
                </div>

                {/* Cédula */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                    Número de cédula <span className="text-red-500">*</span>
                  </label>
                  <input type="number" value={cedula} onChange={e => setCedula(e.target.value)}
                    placeholder="Ej: 1234567890"
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={e => e.key === 'Enter' && validar()}
                  />
                </div>

                {errorAuth && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    <XCircle size={15} className="flex-shrink-0" />
                    {errorAuth}
                  </div>
                )}

                <button onClick={validar} disabled={cargando}
                  className="w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{ background: cargando ? '#94a3b8' : 'linear-gradient(135deg,#1B62CC,#083278)' }}>
                  {cargando ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <><span>Continuar</span><ChevronRight size={16} /></>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-slate-400">
                Si no apareces en la lista, contacta a tu SISO
              </p>
            </motion.div>
          )}

          {/* ── PASO 2: CHECKLIST ─────────────────────────────────────────── */}
          {paso === 'checklist' && conductor && (
            <motion.div key="checklist"
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
              className="max-w-2xl mx-auto p-4 space-y-4 pb-10"
            >
              {/* Info conductor */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                  {(conductor.nombres?.[0] || '') + (conductor.apellidos?.[0] || '')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm">{conductor.nombres} {conductor.apellidos}</p>
                  <p className="text-xs text-blue-700 truncate">{empresaNombre}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-400">Fecha</p>
                  <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                    className="text-xs font-semibold text-slate-700 border-0 bg-transparent focus:outline-none cursor-pointer" />
                </div>
              </div>

              {/* Placa */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-3">
                  Placa del vehículo <span className="text-red-500">*</span>
                </label>
                <input type="text" value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())}
                  placeholder="ABC123" maxLength={8}
                  className="w-full h-12 px-4 rounded-xl border-2 border-slate-300 text-lg font-mono font-bold text-center uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Tipo de vehículo */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-3">
                  Tipo de vehículo <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Motocarro', 'Camión Grande', 'Camión Pequeño', 'Moto'].map(tipo => (
                    <button key={tipo} type="button"
                      onClick={() => setVehiculoTipo(tipo)}
                      className={[
                        'py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all',
                        vehiculoTipo === tipo
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-slate-200 bg-white text-slate-600',
                      ].join(' ')}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Foto */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-3">
                  Foto del vehículo <span className="text-red-500">*</span>
                </label>
                <input ref={fotoRef} type="file" accept="image/*" capture="environment" onChange={handleFoto} className="hidden" />
                {foto ? (
                  <div className="space-y-2">
                    <img src={foto} alt="Vehículo" className="w-full max-h-48 object-cover rounded-xl border border-slate-200" />
                    <button type="button" onClick={() => setFoto(null)} className="text-xs text-red-500 font-medium">Cambiar foto</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fotoRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
                    <Camera size={24} />
                    <span className="text-xs font-medium">Tomar foto del vehículo</span>
                  </button>
                )}
              </div>

              {/* Acción rápida */}
              <div className="flex justify-between items-center px-1">
                <span className="text-xs text-slate-400 font-medium">
                  {totalRespondidos}/{ITEMS_CHECKLIST.length} ítems respondidos
                </span>
                <button type="button" onClick={marcarTodoBueno}
                  className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                  ✓ Marcar todo como Bueno
                </button>
              </div>

              {/* Barra de progreso */}
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full bg-blue-500"
                  animate={{ width: `${(totalRespondidos / ITEMS_CHECKLIST.length) * 100}%` }}
                  transition={{ duration: 0.3 }} />
              </div>

              {/* Items por grupo */}
              {GRUPOS.map(grupo => (
                <div key={grupo} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">{grupo}</p>
                  {ITEMS_CHECKLIST.filter(i => i.grupo === grupo).map(item => (
                    <ItemRow key={item.id} item={item}
                      valor={items[item.id] || ''}
                      observacion={obs[item.id]}
                      onCambio={(id, v) => setItems(p => ({ ...p, [id]: v }))}
                      onObservacion={(id, v) => setObs(p => ({ ...p, [id]: v }))}
                    />
                  ))}
                </div>
              ))}

              {/* Observación general */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Observaciones generales</label>
                <textarea value={obsGeneral} onChange={e => setObsGeneral(e.target.value)} rows={3}
                  placeholder="Condiciones especiales, hallazgos adicionales…"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {errorForm && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <XCircle size={15} className="flex-shrink-0" />{errorForm}
                </div>
              )}

              <button onClick={enviar} disabled={guardando}
                className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg"
                style={{ background: guardando ? '#94a3b8' : 'linear-gradient(135deg,#1B62CC,#083278)', boxShadow: guardando ? 'none' : '0 4px 20px rgba(27,98,204,0.4)' }}>
                {guardando
                  ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  : <><CheckCheck size={18} /><span>Enviar checklist</span></>
                }
              </button>
            </motion.div>
          )}

          {/* ── PASO 3: ÉXITO ─────────────────────────────────────────────── */}
          {paso === 'exito' && (
            <motion.div key="exito"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto p-6 pt-16 flex flex-col items-center text-center space-y-5"
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
              >
                <CheckCircle2 size={44} className="text-green-600" strokeWidth={1.8} />
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">¡Checklist enviado!</h2>
                <p className="text-slate-500 text-sm">
                  El registro quedó guardado correctamente. El SISO puede verlo en tiempo real.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 w-full text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Conductor</span>
                  <span className="font-semibold text-slate-800">{conductor?.nombres} {conductor?.apellidos}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Vehículo</span>
                  <span className="font-semibold text-slate-800 font-mono">{placa}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Fecha</span>
                  <span className="font-semibold text-slate-800">{fecha}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Ítems respondidos</span>
                  <span className="font-semibold text-slate-800">{totalRespondidos}/{ITEMS_CHECKLIST.length}</span>
                </div>
              </div>

              <button onClick={reiniciar}
                className="w-full h-12 rounded-xl text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg,#1B62CC,#083278)' }}>
                Nuevo checklist
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
