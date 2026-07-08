import { CheckCircle2, XCircle, AlertCircle, MinusCircle } from 'lucide-react'
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

export default function ChecklistDetalle({ checklist, vehiculos, empresas, onVolver }) {
  if (!checklist) return null

  const empresa  = empresas.find(e => e.id === checklist.empresaId)
  const vehiculo = vehiculos.find(v => v.id === checklist.vehiculoId)
  const items    = checklist.items || []
  const grupos   = [...new Set(items.map(i => i.grupo))]

  const totalBueno  = items.filter(i => i.estado === 'BUENO').length
  const totalRegular = items.filter(i => i.estado === 'REGULAR').length
  const totalMalo   = items.filter(i => i.estado === 'MALO').length

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
      {checklist.fotoBase64 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Foto del vehículo
          </p>
          <img
            src={checklist.fotoBase64}
            alt="Foto del vehículo"
            className="w-full max-h-72 object-cover rounded-xl border border-slate-200"
          />
        </div>
      )}

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
