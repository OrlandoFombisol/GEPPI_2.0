import { useRef, useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, MinusCircle, Camera, Pencil, Trash2 } from 'lucide-react'
import { checklistDB }                from '@/db'
import { formatearFecha }            from '@/utils/dates'
import { Badge, Button, BackButton } from '@/components/ui'

const ESTADO_ICON = {
  BUENO:   { Icon: CheckCircle2, cls: 'text-green-600'  },
  REGULAR: { Icon: AlertCircle,  cls: 'text-yellow-500' },
  MALO:    { Icon: XCircle,      cls: 'text-red-600'    },
  'N/A':   { Icon: MinusCircle,  cls: 'text-slate-400'  },
}
const ESTADO_BADGE = {
  BUENO:   'success',
  REGULAR: 'warning',
  MALO:    'danger',
  'N/A':   'neutral',
}

export default function ChecklistDetalle({ checklist, vehiculos, empresas, onVolver, onActualizado }) {
  const [fotoNueva,  setFotoNueva]  = useState(null)
  const [editandoFoto, setEditandoFoto] = useState(false)
  const [guardando,  setGuardando]  = useState(false)
  const fotoRef = useRef()

  if (!checklist) return null

  const empresa  = empresas.find(e => e.id === checklist.empresaId)
  const vehiculo = vehiculos.find(v => v.id === checklist.vehiculoId)
  const items    = checklist.items || []
  const grupos   = [...new Set(items.map(i => i.grupo))]

  const totalBueno  = items.filter(i => i.estado === 'BUENO').length
  const totalRegular = items.filter(i => i.estado === 'REGULAR').length
  const totalMalo   = items.filter(i => i.estado === 'MALO').length

  const handleSeleccionFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setFotoNueva(ev.target.result)
    reader.readAsDataURL(file)
  }

  const guardarFoto = async (fotoBase64) => {
    setGuardando(true)
    try {
      await checklistDB.update(checklist.id, {
        fotoBase64,
        fotoFecha: fotoBase64 ? new Date().toISOString() : null,
      })
      setEditandoFoto(false)
      setFotoNueva(null)
      await onActualizado?.()
    } catch (err) {
      alert(`Error al guardar la foto: ${err.message}`)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="p-3 sm:p-6 max-w-3xl mx-auto space-y-5">

      {/* Cabecera */}
      <div className="flex items-start gap-3 flex-wrap">
        <BackButton onClick={onVolver} />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900">Detalle del Checklist</h1>
          <p className="text-sm text-slate-500">{formatearFecha(checklist.fecha)}</p>
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase">Empresa</p>
            <p className="font-semibold text-slate-800 mt-0.5">{empresa?.razonSocial || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase">Conductor</p>
            <p className="font-semibold text-slate-800 mt-0.5">{checklist.conductorNombre}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase">Cédula</p>
            <p className="font-semibold text-slate-800 mt-0.5">{checklist.conductorCedula}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase">Vehículo</p>
            <p className="font-semibold text-slate-800 mt-0.5 font-mono">
              {checklist.vehiculoPlaca || vehiculo?.placa || '—'}
            </p>
            {checklist.vehiculoTipo && (
              <p className="text-xs text-slate-500 mt-0.5">{checklist.vehiculoTipo}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase">Fecha</p>
            <p className="font-semibold text-slate-800 mt-0.5">{formatearFecha(checklist.fecha)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase">Registrado</p>
            <p className="font-semibold text-slate-800 mt-0.5">{formatearFecha(checklist.fechaCreacion)}</p>
          </div>
        </div>

        {/* Stats de ítems */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
          {[
            { label: 'Buenos',   val: totalBueno,   cls: 'text-green-700 bg-green-50' },
            { label: 'Regulares',val: totalRegular, cls: 'text-yellow-700 bg-yellow-50' },
            { label: 'Malos',    val: totalMalo,    cls: 'text-red-700 bg-red-50' },
          ].map(({ label, val, cls }) => (
            <div key={label} className={`${cls} px-3 py-1.5 rounded-lg text-center`}>
              <span className="text-lg font-black tabular-nums block">{val}</span>
              <span className="text-[11px] font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Foto */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Foto del vehículo
          </p>
          {!editandoFoto && (
            <button
              onClick={() => { setFotoNueva(null); setEditandoFoto(true) }}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:text-primary-900"
            >
              <Pencil size={12} /> {checklist.fotoBase64 ? 'Cambiar foto' : 'Agregar foto'}
            </button>
          )}
        </div>

        {editandoFoto ? (
          <div className="space-y-3">
            <input ref={fotoRef} type="file" accept="image/*" capture="environment"
              onChange={handleSeleccionFoto} className="hidden" />

            {fotoNueva ? (
              <img src={fotoNueva} alt="Nueva foto" className="w-full max-h-72 object-cover rounded-xl border border-slate-200" />
            ) : checklist.fotoBase64 ? (
              <img src={checklist.fotoBase64} alt="Foto actual" className="w-full max-h-72 object-cover rounded-xl border border-slate-200 opacity-60" />
            ) : (
              <button type="button" onClick={() => fotoRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-slate-300 hover:bg-slate-50 transition-all">
                <Camera size={20} />
                <span className="text-xs font-medium">Tomar o adjuntar foto</span>
              </button>
            )}

            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => { setEditandoFoto(false); setFotoNueva(null) }} disabled={guardando}>
                Cancelar
              </Button>
              {!fotoNueva && (
                <Button variant="secondary" size="sm" iconLeft={Camera} onClick={() => fotoRef.current?.click()} disabled={guardando}>
                  {checklist.fotoBase64 ? 'Tomar otra' : 'Tomar foto'}
                </Button>
              )}
              {checklist.fotoBase64 && !fotoNueva && (
                <Button variant="danger" size="sm" iconLeft={Trash2} onClick={() => guardarFoto(null)} loading={guardando}>
                  Quitar foto
                </Button>
              )}
              {fotoNueva && (
                <Button size="sm" onClick={() => guardarFoto(fotoNueva)} loading={guardando}>
                  Guardar foto
                </Button>
              )}
            </div>
          </div>
        ) : checklist.fotoBase64 ? (
          <img
            src={checklist.fotoBase64}
            alt="Foto del vehículo"
            className="w-full max-h-72 object-cover rounded-xl border border-slate-200"
          />
        ) : (
          <p className="text-sm text-slate-400 text-center py-6">Sin foto registrada.</p>
        )}
      </div>

      {/* Ítems agrupados */}
      {grupos.map(grupo => {
        const grupoItems = items.filter(i => i.grupo === grupo)
        return (
          <div key={grupo} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">
              {grupo}
            </p>
            <div className="space-y-0">
              {grupoItems.map(item => {
                const config = ESTADO_ICON[item.estado] || ESTADO_ICON['N/A']
                const { Icon, cls } = config
                return (
                  <div key={item.id} className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
                    <Icon size={16} className={`${cls} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800">{item.label}</p>
                      {item.observacion && (
                        <p className="text-xs text-amber-700 mt-0.5 bg-amber-50 rounded px-2 py-0.5">
                          {item.observacion}
                        </p>
                      )}
                    </div>
                    <Badge variant={ESTADO_BADGE[item.estado] || 'neutral'} size="sm">
                      {item.estado}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Observación general */}
      {checklist.observacionGeneral && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-widest mb-2">
            Observaciones generales
          </p>
          <p className="text-sm text-amber-800">{checklist.observacionGeneral}</p>
        </div>
      )}

      <div className="pb-6">
        <BackButton onClick={onVolver} />
      </div>
    </div>
  )
}
