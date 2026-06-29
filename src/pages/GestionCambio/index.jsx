import { useState, useEffect } from 'react'
import { Plus, GitBranch, AlertTriangle, FileText } from 'lucide-react'
import { gestionCambioDB }  from '@/db'
import { SISTEMA }           from '@/constants'
import { formatearFechaLarga, formatearFecha } from '@/utils/dates'
import { Badge, Button, AlertBanner }          from '@/components/ui'
import CambioModal                             from './CambioModal'

// ─── Etiqueta de módulo ───────────────────────────────────────────────────────
const MODULO_LABEL = {
  MATRIZ_EPP:    'Matriz EPP',
  MATRIZ_CARGOS: 'Matriz Cargos',
  INVENTARIO:    'Inventario',
  ENTREGAS:      'Entregas',
  TRABAJADORES:  'Trabajadores',
  CONFIGURACION: 'Configuración',
}

// ─── Tarjeta de una entrada del timeline ─────────────────────────────────────
function EntradaCambio({ cambio, esActual }) {
  const desc = cambio.descripcion || cambio.descripcionCambio || '—'
  return (
    <div className={[
      'bg-white rounded-xl border p-4 transition-all',
      esActual ? 'border-primary-300 ring-2 ring-primary-100 shadow-sm' : 'border-slate-200',
    ].join(' ')}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={[
            'px-2.5 py-1 rounded-lg text-sm font-black font-mono tracking-wide',
            esActual ? 'bg-primary-800 text-white' : 'bg-slate-100 text-slate-700',
          ].join(' ')}>
            v{cambio.versionNueva}
          </span>
          {cambio.codigoDocumento && (
            <span className="text-xs text-slate-400 font-mono">{cambio.codigoDocumento}</span>
          )}
          {cambio.modulo && MODULO_LABEL[cambio.modulo] && (
            <Badge variant="info" size="sm">{MODULO_LABEL[cambio.modulo]}</Badge>
          )}
          {esActual && (
            <Badge variant="success" size="sm">Versión actual</Badge>
          )}
        </div>
        <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
          {cambio.fecha ? formatearFecha(cambio.fecha) : '—'}
        </span>
      </div>

      <p className="text-sm text-slate-700 mt-3 leading-relaxed">{desc}</p>

      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        {cambio.responsable && (
          <span><strong className="font-medium">Responsable:</strong> {cambio.responsable}</span>
        )}
        {cambio.cargoResponsable && (
          <span><strong className="font-medium">Cargo:</strong> {cambio.cargoResponsable}</span>
        )}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Page() {
  const [cambios,  setCambios]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [modal,    setModal]    = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const data = await gestionCambioDB.getAll()
      setCambios(data || [])
    } finally {
      setLoading(false)
    }
  }

  const guardar = async (datos) => {
    setSaving(true)
    try {
      await gestionCambioDB.create(datos)
      setModal(false)
      await cargar()
    } finally {
      setSaving(false)
    }
  }

  const versionActual = cambios[0]?.versionNueva || SISTEMA.VERSION_MATRIZ

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <GitBranch size={22} className="text-primary-700" strokeWidth={1.8} />
            Gestión del Cambio
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Historial documental · {SISTEMA.CODIGO_DOCUMENTO} · Versión actual: <strong>v{versionActual}</strong>
          </p>
        </div>
        <Button iconLeft={Plus} onClick={() => setModal(true)}>
          Nueva versión
        </Button>
      </div>

      {/* Aviso normativo */}
      <AlertBanner
        level="info"
        message={`Control de versiones del documento ${SISTEMA.CODIGO_DOCUMENTO}. Conforme al Decreto 1072/2015 y la Resolución 0312/2019, se debe registrar toda modificación a la Matriz de EPP.`}
      />

      {/* Timeline */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : cambios.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText size={36} className="text-slate-300 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-slate-600">Sin registros de cambio</p>
          <p className="text-xs text-slate-400 mt-1">
            Importa la Matriz MT-SST-005 en Configuración para cargar el historial,
            o crea el primer registro manualmente.
          </p>
        </div>
      ) : (
        <div className="relative pl-7">
          {/* Línea vertical del timeline */}
          <div className="absolute left-2 top-3 bottom-3 w-0.5 bg-slate-200" />

          <div className="space-y-4">
            {cambios.map((cambio, i) => (
              <div key={cambio.id ?? i} className="relative">
                {/* Punto del timeline */}
                <div className={[
                  'absolute -left-7 top-4 w-5 h-5 rounded-full border-2 z-10',
                  i === 0
                    ? 'bg-primary-800 border-primary-800'
                    : 'bg-white border-slate-300',
                ].join(' ')} />

                <EntradaCambio cambio={cambio} esActual={i === 0} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <CambioModal
          onSave={guardar}
          onClose={() => setModal(false)}
          saving={saving}
        />
      )}

    </div>
  )
}
