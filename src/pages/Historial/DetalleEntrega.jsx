import { useState, useEffect }      from 'react'
import { Loader2, Ban }              from 'lucide-react'
import { detalleEntregaDB, firmaDB, eppDB, entregaDB } from '@/db'
import { ESTADO_EPP_LABEL }          from '@/constants'
import { calcularEstadoEPP, formatearFecha, formatearFechaHora } from '@/utils/dates'
import { formatearNumeroActa, obtenerIniciales } from '@/utils/formatters'
import { Modal, Badge, Button }      from '@/components/ui'
import BotonPDF                      from '@/components/pdf/BotonPDF'
import AnularModal                   from './AnularModal'

// ─── Fila EPP con semáforo ────────────────────────────────────────────────────
function FilaEPP({ detalle, epp }) {
  const estado = calcularEstadoEPP(detalle.fechaVencimiento)
  const rowCls = estado === 'VENCIDO'        ? 'bg-red-50/60'    :
                 estado === 'PROXIMO_VENCER'  ? 'bg-yellow-50/60' : ''

  return (
    <tr className={['border-b border-slate-100 last:border-0', rowCls].join(' ')}>
      <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">
        {String(epp?.item || '').padStart(2, '0')}
      </td>
      <td className="px-3 py-2.5 text-slate-800 font-medium text-sm">{epp?.nombre || '—'}</td>
      <td className="px-3 py-2.5 text-center tabular-nums text-sm">{detalle.cantidad}</td>
      <td className="px-3 py-2.5 text-center font-mono text-xs text-slate-500">
        {detalle.fechaVencimiento ? formatearFecha(detalle.fechaVencimiento) : '—'}
      </td>
      <td className="px-3 py-2.5 text-center">
        <Badge
          variant={
            estado === 'VIGENTE'        ? 'success'  :
            estado === 'PROXIMO_VENCER' ? 'warning'  :
            estado === 'VENCIDO'        ? 'danger'   : 'neutral'
          }
          size="sm"
        >
          {ESTADO_EPP_LABEL[estado] || estado}
        </Badge>
      </td>
    </tr>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function DetalleEntrega({ entrega, onClose, onAnulada }) {
  const [detalles,  setDetalles]  = useState([])
  const [firma,     setFirma]     = useState(null)
  const [epps,      setEpps]      = useState([])
  const [cargando,  setCargando]  = useState(true)
  const [salvando,  setSalvando]  = useState(false)
  const [modalAnular, setModalAnular] = useState(false)

  useEffect(() => {
    if (entrega?.id) cargarDatos()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrega?.id])

  async function cargarDatos() {
    setCargando(true)
    try {
      const [dets, frm, todosEPP] = await Promise.all([
        detalleEntregaDB.getPorEntrega(entrega.id),
        firmaDB.getPorEntrega(entrega.id),
        eppDB.getAll(),
      ])
      setDetalles(dets     || [])
      setFirma(frm         || null)
      setEpps(todosEPP     || [])
    } finally {
      setCargando(false)
    }
  }

  const eppMap = Object.fromEntries(epps.map(e => [e.id, e]))
  const esFirmada = entrega.estado === 'FIRMADA'

  const handleAnular = async (motivo) => {
    setSalvando(true)
    try {
      await entregaDB.anular(entrega.id, motivo, 1)
      setModalAnular(false)
      onAnulada?.()
      onClose()
    } finally {
      setSalvando(false)
    }
  }

  const acta = formatearNumeroActa(entrega.id, new Date(entrega.fechaEntrega).getFullYear())

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={`Acta ${acta}`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {esFirmada && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={Ban}
                  onClick={() => setModalAnular(true)}
                  className="text-red-600 hover:bg-red-50"
                >
                  Anular
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onClose}>Cerrar</Button>
              {esFirmada && (
                <BotonPDF
                  entregaId={entrega.id}
                  variant="primary"
                  size="md"
                  label="Descargar PDF"
                />
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-4">

          {/* ── Header del acta ── */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-xs text-slate-400">
              {formatearFechaHora(entrega.fechaEntrega)}
            </span>
            <Badge variant={
              entrega.estado === 'FIRMADA'   ? 'firmada'  :
              entrega.estado === 'PENDIENTE' ? 'pendiente': 'danger'
            }>
              {entrega.estado === 'FIRMADA'   ? 'Firmada'  :
               entrega.estado === 'PENDIENTE' ? 'Pendiente': 'Anulada'}
            </Badge>
            {entrega.pdfGenerado && <Badge variant="success" size="sm">PDF generado</Badge>}
          </div>

          {entrega.estado === 'ANULADA' && entrega.motivoAnulacion && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800">
              <strong>Motivo de anulación:</strong> {entrega.motivoAnulacion}
            </div>
          )}

          {/* ── Datos del trabajador ── */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-primary-50 border border-primary-100">
            <div className="w-10 h-10 rounded-xl bg-primary-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {obtenerIniciales(`${entrega.trabajadorNombre || 'T T'}`)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 truncate">{entrega.trabajadorNombre || '—'}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                CC {entrega.cedula || '—'} · {entrega.cargoNombre || '—'} · {entrega.sedeNombre || '—'}
              </p>
            </div>
          </div>

          {/* ── Tabla EPP ── */}
          {cargando ? (
            <div className="flex justify-center py-6">
              <Loader2 size={22} className="animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['#', 'Elemento de Protección Personal', 'Cant.', 'Vence', 'Estado'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold
                                             text-slate-600 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {detalles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-400 text-xs">
                        Sin ítems de detalle registrados.
                      </td>
                    </tr>
                  ) : detalles.map(d => (
                    <FilaEPP key={d.id} detalle={d} epp={eppMap[d.eppId]} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Firma digital ── */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Firma del trabajador
              </p>
              <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50
                              flex items-center justify-center" style={{ minHeight: 80 }}>
                {firma?.firmaBase64 ? (
                  <img
                    src={firma.firmaBase64}
                    alt="Firma digital"
                    className="max-h-20 max-w-full object-contain p-2"
                  />
                ) : (
                  <span className="text-xs text-slate-300">Sin firma capturada</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Responsable de entrega
              </p>
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  {entrega.responsableNombre || '—'}
                </p>
                {entrega.observaciones && (
                  <p className="text-xs text-slate-500 italic">"{entrega.observaciones}"</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </Modal>

      {/* Modal de anulación */}
      {modalAnular && (
        <AnularModal
          entrega={entrega}
          onConfirmar={handleAnular}
          onClose={() => setModalAnular(false)}
          saving={salvando}
        />
      )}
    </>
  )
}
