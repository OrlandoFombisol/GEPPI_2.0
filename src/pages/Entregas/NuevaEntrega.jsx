import { useState }         from 'react'
import { CheckCircle2 }     from 'lucide-react'
import { entregaDB }        from '@/db'
import { Button }           from '@/components/ui'
import BotonPDF             from '@/components/pdf/BotonPDF'
import Paso1Trabajador      from './pasos/Paso1Trabajador'
import Paso2EPP             from './pasos/Paso2EPP'
import Paso3Firma           from './pasos/Paso3Firma'
import Paso4Confirmar       from './pasos/Paso4Confirmar'

// ─── Indicador de pasos ───────────────────────────────────────────────────────

const PASOS = [
  { n: 1, label: 'Trabajador' },
  { n: 2, label: 'EPP'        },
  { n: 3, label: 'Firma'      },
  { n: 4, label: 'Confirmar'  },
]

function Stepper({ pasoActual }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8 select-none">
      {PASOS.map(({ n, label }, i) => {
        const hecho  = pasoActual > n
        const activo = pasoActual === n
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={[
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                hecho  ? 'bg-green-600 text-white' :
                activo ? 'bg-primary-800 text-white ring-4 ring-primary-200' :
                         'bg-slate-200 text-slate-500',
              ].join(' ')}>
                {hecho ? <CheckCircle2 size={14} /> : n}
              </div>
              <span className={[
                'text-[10px] font-medium mt-1 whitespace-nowrap',
                activo ? 'text-primary-800' : hecho ? 'text-green-700' : 'text-slate-400',
              ].join(' ')}>
                {label}
              </span>
            </div>
            {i < PASOS.length - 1 && (
              <div className={[
                'w-16 h-0.5 -mt-4 mx-1',
                pasoActual > n ? 'bg-green-400' : 'bg-slate-200',
              ].join(' ')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Pantalla de éxito ────────────────────────────────────────────────────────

function Exito({ entregaId, firmaBase64, onNueva, onHistorial }) {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle2 size={36} className="text-green-600" strokeWidth={1.8} />
      </div>
      <div>
        <h3 className="text-xl font-bold text-slate-900">¡Entrega registrada!</h3>
        <p className="text-sm text-slate-500 mt-1">
          Acta <span className="font-mono font-bold text-primary-800">#{entregaId}</span> creada y firmada exitosamente.
        </p>
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        <Button variant="secondary" onClick={onHistorial}>Ver historial</Button>
        <BotonPDF
          entregaId={entregaId}
          firmaBase64={firmaBase64}
          variant="primary"
          label="Descargar acta PDF"
        />
        <Button variant="ghost" onClick={onNueva}>Nueva entrega</Button>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function NuevaEntrega({ onCancelar, onCompletado }) {
  const [paso,    setPaso]    = useState(1)
  const [saving,  setSaving]  = useState(false)
  const [exito,   setExito]   = useState(null) // null | entregaId

  const [datos, setDatos] = useState({
    trabajador:   null,
    cargo:        null,
    eppItems:     [],
    firmaBase64:  null,
  })

  const actualizar = (partial) => setDatos(prev => ({ ...prev, ...partial }))

  // Navegación entre pasos
  const paso1Next = ({ trabajador, cargo }) => {
    actualizar({ trabajador, cargo, eppItems: [] })
    setPaso(2)
  }
  const paso2Next = ({ eppItems }) => {
    actualizar({ eppItems })
    setPaso(3)
  }
  const paso3Next = ({ firmaBase64 }) => {
    actualizar({ firmaBase64 })
    setPaso(4)
  }

  // Confirmar entrega
  const confirmar = async ({ responsable, observaciones }) => {
    setSaving(true)
    try {
      const entregaId = await entregaDB.confirmar({
        trabajador:  datos.trabajador,
        cargo:       datos.cargo,
        epps:        datos.eppItems,
        observaciones,
        responsable,
        firmaBase64: datos.firmaBase64,
        usuarioId:   1,
      })
      setExito(entregaId)
    } finally {
      setSaving(false)
    }
  }

  // Reiniciar para nueva entrega
  const reiniciar = () => {
    setDatos({ trabajador: null, cargo: null, eppItems: [], firmaBase64: null })
    setPaso(1)
    setExito(null)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {exito ? (
        <Exito
          entregaId={exito}
          firmaBase64={datos.firmaBase64}
          onNueva={reiniciar}
          onHistorial={onCompletado}
        />
      ) : (
        <>
          <Stepper pasoActual={paso} />

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            {paso === 1 && (
              <Paso1Trabajador
                seleccionado={datos.trabajador ? { trabajador: datos.trabajador } : null}
                onNext={paso1Next}
              />
            )}
            {paso === 2 && (
              <Paso2EPP
                trabajador={datos.trabajador}
                cargo={datos.cargo}
                eppItemsInicial={datos.eppItems.length ? datos.eppItems : null}
                onNext={paso2Next}
                onAnterior={() => setPaso(1)}
              />
            )}
            {paso === 3 && (
              <Paso3Firma
                trabajador={datos.trabajador}
                onNext={paso3Next}
                onAnterior={() => setPaso(2)}
              />
            )}
            {paso === 4 && (
              <Paso4Confirmar
                trabajador={datos.trabajador}
                cargo={datos.cargo}
                eppItems={datos.eppItems}
                firmaBase64={datos.firmaBase64}
                onConfirmar={confirmar}
                onAnterior={() => setPaso(3)}
                saving={saving}
              />
            )}
          </div>

          {/* Botón cancelar */}
          <div className="mt-4 text-center">
            <button
              onClick={onCancelar}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancelar y volver al listado
            </button>
          </div>
        </>
      )}
    </div>
  )
}
