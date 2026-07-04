import { useState, useRef } from 'react'
import { Camera, CheckCircle2, XCircle, AlertCircle, ChevronLeft } from 'lucide-react'
import { checklistDB, vehiculoDB, alertaDB } from '@/db'
import { Button, AlertBanner }       from '@/components/ui'

// ─── Ítems del checklist preoperacional ──────────────────────────────────────

const ITEMS_CHECKLIST = [
  { id: 'estado_general',     grupo: 'General',      label: 'Estado general del vehículo' },
  { id: 'limpieza',           grupo: 'General',      label: 'Limpieza interior y exterior' },
  { id: 'luces_delanteras',   grupo: 'Iluminación',  label: 'Luces delanteras (alta y baja)' },
  { id: 'luces_traseras',     grupo: 'Iluminación',  label: 'Luces traseras y de reversa' },
  { id: 'direccionales',      grupo: 'Iluminación',  label: 'Direccionales / pitos' },
  { id: 'frenos_pie',         grupo: 'Frenos',       label: 'Freno de pie (principal)' },
  { id: 'freno_mano',         grupo: 'Frenos',       label: 'Freno de mano (estacionamiento)' },
  { id: 'freno_aire',         grupo: 'Frenos',       label: 'Freno de aire' },
  { id: 'llanta_delantera_i', grupo: 'Llantas',      label: 'Llanta delantera izquierda' },
  { id: 'llanta_delantera_d', grupo: 'Llantas',      label: 'Llanta delantera derecha' },
  { id: 'llanta_trasera_i',   grupo: 'Llantas',      label: 'Llanta trasera izquierda' },
  { id: 'llanta_trasera_d',   grupo: 'Llantas',      label: 'Llanta trasera derecha' },
  { id: 'llanta_repuesto',    grupo: 'Llantas',      label: 'Llanta de repuesto' },
  { id: 'espejo_retrovisor',  grupo: 'Visibilidad',  label: 'Espejo retrovisor central' },
  { id: 'espejo_izquierdo',   grupo: 'Visibilidad',  label: 'Espejo lateral izquierdo' },
  { id: 'espejo_derecho',     grupo: 'Visibilidad',  label: 'Espejo lateral derecho' },
  { id: 'vidrios',            grupo: 'Visibilidad',  label: 'Vidrios (sin grietas/roturas)' },
  { id: 'cinturon_conductor', grupo: 'Seguridad',    label: 'Cinturón de seguridad conductor' },
  { id: 'cinturon_pasajeros', grupo: 'Seguridad',    label: 'Cinturones de pasajeros' },
  { id: 'extintor',           grupo: 'Seguridad',    label: 'Extintor (vigente y cargado)' },
  { id: 'botiquin',           grupo: 'Seguridad',    label: 'Botiquín de primeros auxilios' },
  { id: 'kit_carretera',      grupo: 'Seguridad',    label: 'Kit de carretera (señales, chaleco)' },
  { id: 'aceite_motor',       grupo: 'Fluidos',      label: 'Nivel de aceite del motor' },
  { id: 'agua_radiador',      grupo: 'Fluidos',      label: 'Nivel de agua / líquido refrigerante' },
  { id: 'liquido_frenos',     grupo: 'Fluidos',      label: 'Nivel de líquido de frenos' },
  { id: 'combustible',        grupo: 'Fluidos',      label: 'Nivel de combustible' },
  { id: 'soat',               grupo: 'Documentos',   label: 'SOAT vigente' },
  { id: 'tecnicomecanica',    grupo: 'Documentos',   label: 'Revisión técnico-mecánica vigente' },
  { id: 'tarjeta_propiedad',  grupo: 'Documentos',   label: 'Tarjeta de propiedad / circulación' },
  { id: 'licencia_conduccion',grupo: 'Documentos',   label: 'Licencia de conducción vigente' },
]

const ESTADOS_ITEM = [
  { value: 'BUENO',    label: 'Bueno',    Icon: CheckCircle2, cls: 'text-green-600 bg-green-50 border-green-200',  clsActive: 'bg-green-600 text-white border-green-600' },
  { value: 'REGULAR',  label: 'Regular',  Icon: AlertCircle,  cls: 'text-yellow-600 bg-yellow-50 border-yellow-200', clsActive: 'bg-yellow-500 text-white border-yellow-500' },
  { value: 'MALO',     label: 'Malo',     Icon: XCircle,      cls: 'text-red-600 bg-red-50 border-red-200',       clsActive: 'bg-red-600 text-white border-red-600' },
  { value: 'N/A',      label: 'N/A',      Icon: null,         cls: 'text-slate-400 bg-slate-50 border-slate-200', clsActive: 'bg-slate-500 text-white border-slate-500' },
]

// ─── Componente ítem individual ───────────────────────────────────────────────

function ItemChecklist({ item, valor, observacion, onChange, onObservacion }) {
  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm text-slate-800 font-medium flex-1 min-w-0">{item.label}</span>
        <div className="flex gap-1.5">
          {ESTADOS_ITEM.map(({ value, label, Icon, cls, clsActive }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange(item.id, value)}
              className={[
                'px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1',
                valor === value ? clsActive : cls,
              ].join(' ')}
            >
              {Icon && <Icon size={11} />}
              {label}
            </button>
          ))}
        </div>
      </div>
      {(valor === 'MALO' || valor === 'REGULAR') && (
        <input
          type="text"
          value={observacion || ''}
          onChange={e => onObservacion(item.id, e.target.value)}
          placeholder="Describir hallazgo…"
          className="mt-2 w-full h-8 px-3 rounded-lg border border-slate-300 text-xs text-slate-800
                     focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        />
      )}
    </div>
  )
}

// ─── Formulario principal ─────────────────────────────────────────────────────

export default function ChecklistForm({ vehiculos, empresas, onGuardado, onCancelar }) {
  const today = new Date().toISOString().slice(0, 10)

  const [fecha,           setFecha]           = useState(today)
  const [empresaId,       setEmpresaId]       = useState('')
  const [vehiculoId,      setVehiculoId]      = useState('')
  const [vehiculoPlaca,   setVehiculoPlaca]   = useState('')
  const [conductorNombre, setConductorNombre] = useState('')
  const [conductorCedula, setConductorCedula] = useState('')
  const [items,           setItems]           = useState({})
  const [observaciones,   setObservaciones]   = useState({})
  const [observacionGeneral, setObservacionGeneral] = useState('')
  const [fotoBase64,      setFotoBase64]      = useState(null)
  const [guardando,       setGuardando]       = useState(false)
  const [error,           setError]           = useState('')

  const fotoRef = useRef()

  // Seleccionar empresa autocompleta vehículos asociados
  const vehiculosFiltrados = empresaId
    ? vehiculos.filter(v => v.estado === 'ACTIVO' && v.empresaId === Number(empresaId))
    : vehiculos.filter(v => v.estado === 'ACTIVO')

  const handleItemChange = (id, valor) => {
    setItems(prev => ({ ...prev, [id]: valor }))
  }
  const handleObservacion = (id, texto) => {
    setObservaciones(prev => ({ ...prev, [id]: texto }))
  }

  const handleFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setFotoBase64(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleVehiculo = (id) => {
    setVehiculoId(id)
    const veh = vehiculos.find(v => v.id === Number(id))
    if (veh) setVehiculoPlaca(veh.placa)
  }

  const totalRespondidos = ITEMS_CHECKLIST.filter(i => items[i.id]).length

  const guardar = async () => {
    setError('')

    if (!empresaId)       return setError('Selecciona una empresa.')
    if (!conductorNombre.trim()) return setError('Ingresa el nombre del conductor.')
    if (!conductorCedula.trim()) return setError('Ingresa la cédula del conductor.')
    if (!fotoBase64)      return setError('La foto diaria del vehículo es obligatoria.')
    if (totalRespondidos < ITEMS_CHECKLIST.length * 0.7) {
      return setError(`Por favor completa al menos el 70% del checklist (${Math.ceil(ITEMS_CHECKLIST.length * 0.7)} ítems).`)
    }

    setGuardando(true)
    try {
      const itemsArray = ITEMS_CHECKLIST.map(item => ({
        id:          item.id,
        grupo:       item.grupo,
        label:       item.label,
        estado:      items[item.id] || 'N/A',
        observacion: observaciones[item.id] || '',
      }))

      // Crear vehículo nuevo si se digitó placa manualmente y no está en el sistema
      let finalVehiculoId = vehiculoId ? Number(vehiculoId) : null
      if (!finalVehiculoId && vehiculoPlaca.trim()) {
        finalVehiculoId = await vehiculoDB.create({
          placa:     vehiculoPlaca.trim().toUpperCase(),
          empresaId: Number(empresaId),
          tipo:      '',
          marca:     '',
          modelo:    '',
        })
      }

      const checklistId = await checklistDB.create({
        fecha,
        empresaId:        Number(empresaId),
        vehiculoId:       finalVehiculoId,
        vehiculoPlaca:    vehiculoPlaca.trim().toUpperCase(),
        conductorNombre:  conductorNombre.trim(),
        conductorCedula:  conductorCedula.trim(),
        items:            itemsArray,
        observacionGeneral: observacionGeneral.trim(),
        fotoBase64,
        fotoFecha:        new Date().toISOString(),
      })

      // Generar alerta interna si hay ítems en estado MALO o REGULAR
      const itemsMalo    = itemsArray.filter(i => i.estado === 'MALO')
      const itemsRegular = itemsArray.filter(i => i.estado === 'REGULAR')
      if (itemsMalo.length > 0 || itemsRegular.length > 0) {
        const partes = []
        if (itemsMalo.length > 0)    partes.push(`${itemsMalo.length} ítem(s) MALO`)
        if (itemsRegular.length > 0) partes.push(`${itemsRegular.length} ítem(s) REGULAR`)
        const vehiculoInfo = vehiculoPlaca.trim()
          ? `Vehículo ${vehiculoPlaca.trim().toUpperCase()}`
          : `Conductor ${conductorNombre.trim()}`
        await alertaDB.create({
          tipo:        'CHECKLIST_HALLAZGO',
          nivel:       itemsMalo.length > 0 ? 'CRITICA' : 'ADVERTENCIA',
          mensaje:     `${vehiculoInfo} · ${partes.join(' y ')}. Conductor: ${conductorNombre.trim()}.`,
          referenciaId: String(checklistId),
        })
      }

      onGuardado()
    } catch (err) {
      setError(`Error al guardar: ${err.message}`)
    } finally {
      setGuardando(false)
    }
  }

  // Agrupar ítems por grupo
  const grupos = [...new Set(ITEMS_CHECKLIST.map(i => i.grupo))]

  return (
    <div className="p-3 sm:p-6 max-w-3xl mx-auto space-y-5">

      {/* Cabecera */}
      <div className="flex items-center gap-3">
        <button onClick={onCancelar} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Checklist Preoperacional</h1>
          <p className="text-sm text-slate-500">Inspección diaria de vehículo — SST</p>
        </div>
      </div>

      {/* Datos generales */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Información general
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Empresa <span className="text-red-500">*</span></label>
            <select
              value={empresaId}
              onChange={e => { setEmpresaId(e.target.value); setVehiculoId('') }}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Seleccionar empresa</option>
              {empresas.filter(e => e.estado === 'ACTIVO').map(e => (
                <option key={e.id} value={e.id}>{e.razonSocial}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Fecha <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Nombre del conductor <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={conductorNombre}
              onChange={e => setConductorNombre(e.target.value)}
              placeholder="Nombre completo"
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Cédula del conductor <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={conductorCedula}
              onChange={e => setConductorCedula(e.target.value)}
              placeholder="12345678"
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Vehículo (placa)</label>
            <div className="flex gap-2">
              <select
                value={vehiculoId}
                onChange={e => handleVehiculo(e.target.value)}
                className="flex-1 h-9 px-3 rounded-lg border border-slate-300 text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Seleccionar o digitar placa</option>
                {vehiculosFiltrados.map(v => (
                  <option key={v.id} value={v.id}>{v.placa}{v.marca ? ` — ${v.marca}` : ''}</option>
                ))}
              </select>
              {!vehiculoId && (
                <input
                  type="text"
                  value={vehiculoPlaca}
                  onChange={e => setVehiculoPlaca(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={8}
                  className="w-24 h-9 px-3 rounded-lg border border-slate-300 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono uppercase"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Foto obligatoria */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Foto del vehículo <span className="text-red-500">*</span>
        </p>
        <input
          ref={fotoRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFoto}
          className="hidden"
        />
        {fotoBase64 ? (
          <div className="space-y-2">
            <img src={fotoBase64} alt="Foto vehículo" className="w-full max-h-52 object-cover rounded-xl border border-slate-200" />
            <button
              type="button"
              onClick={() => setFotoBase64(null)}
              className="text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              Eliminar foto
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fotoRef.current?.click()}
            className="w-full h-28 border-2 border-dashed border-slate-300 rounded-xl
                       flex flex-col items-center justify-center gap-2
                       text-slate-400 hover:border-primary-400 hover:text-primary-600 transition-colors"
          >
            <Camera size={28} />
            <span className="text-xs font-medium">Tomar o adjuntar foto del vehículo</span>
          </button>
        )}
      </div>

      {/* Checklist por grupos */}
      {grupos.map(grupo => (
        <div key={grupo} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">
            {grupo}
          </p>
          {ITEMS_CHECKLIST.filter(i => i.grupo === grupo).map(item => (
            <ItemChecklist
              key={item.id}
              item={item}
              valor={items[item.id] || ''}
              observacion={observaciones[item.id]}
              onChange={handleItemChange}
              onObservacion={handleObservacion}
            />
          ))}
        </div>
      ))}

      {/* Observación general */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Observaciones generales
        </p>
        <textarea
          value={observacionGeneral}
          onChange={e => setObservacionGeneral(e.target.value)}
          rows={3}
          placeholder="Descripción de hallazgos, condiciones especiales del vehículo…"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white resize-none
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Progreso */}
      <div className="text-xs text-slate-500 text-center">
        {totalRespondidos} de {ITEMS_CHECKLIST.length} ítems respondidos
      </div>

      {error && <AlertBanner level="danger" message={error} />}

      {/* Acciones */}
      <div className="flex justify-between pb-6">
        <Button variant="secondary" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button onClick={guardar} loading={guardando}>
          Guardar checklist
        </Button>
      </div>
    </div>
  )
}
