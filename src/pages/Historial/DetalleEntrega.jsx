import { useState, useEffect }      from 'react'
import { Loader2, Ban, QrCode, Copy } from 'lucide-react'
import QRCode                        from 'qrcode'
import { useUser }                   from '@/contexts/UserContext'
import { detalleEntregaDB, firmaDB, eppDB, entregaDB } from '@/db'
import { ESTADO_EPP_LABEL }          from '@/constants'
import { calcularEstadoEPP, formatearFecha, formatearFechaHora } from '@/utils/dates'
import { formatearNumeroActa, obtenerIniciales } from '@/utils/formatters'
import { Modal, Badge, Button }      from '@/components/ui'
import BotonPDF                      from '@/components/pdf/BotonPDF'
import AnularModal                   from './AnularModal'
import { anioDe } from '@/utils/dates'

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
  const [errorAnular, setErrorAnular] = useState('')
  const [qrImg,       setQrImg]       = useState(null)
  const [copiado,     setCopiado]     = useState(false)
  const { user } = useUser()
  const esPendiente = entrega.estado === 'PENDIENTE'
  const urlFirma = esPendiente && entrega.tokenAceptacion
    ? `${window.location.origin}/aceptar/${entrega.tokenAceptacion}` : null

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

  // Retomar un acta pendiente: el mismo QR para que el trabajador firme
  const mostrarQR = async () => {
    if (!urlFirma) return
    setQrImg(await QRCode.toDataURL(urlFirma, { width: 240, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } }))
  }

  const handleAnular = async (motivo, devolverStock) => {
    setSalvando(true); setErrorAnular('')
    try {
      await entregaDB.anular(entrega.id, motivo, user?.id || null, { devolverStock })
      setModalAnular(false)
      onAnulada?.()
      onClose()
    } catch (e) {
      setModalAnular(false)
      setErrorAnular(`No se pudo anular el acta: ${e.message}`)
    } finally {
      setSalvando(false)
    }
  }

  const acta = formatearNumeroActa(entrega.id, anioDe(entrega.fechaEntrega))

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
              {(esFirmada || esPendiente) && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconLeft={Ban}
                  onClick={() => setModalAnular(true)}
                  className="text-red-600 hover:bg-red-50"
                >
                  {esPendiente ? 'Cancelar acta' : 'Anular'}
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

          {errorAnular && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800">{errorAnular}</div>
          )}

          {urlFirma && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900 space-y-3">
              <p><strong>Falta la firma del trabajador.</strong> Puede firmar escaneando el QR con su celular, o cancela el acta para devolver los EPP al inventario.</p>
              {qrImg
                ? <img src={qrImg} alt="QR para firmar" className="w-48 h-48 rounded-xl mx-auto shadow" />
                : <Button size="sm" iconLeft={QrCode} onClick={mostrarQR}>Mostrar el QR para firmar</Button>}
              <button
                onClick={() => { navigator.clipboard.writeText(urlFirma); setCopiado(true); setTimeout(() => setCopiado(false), 2000) }}
                className="flex items-center gap-2 text-xs bg-white border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 font-medium"
              >
                <Copy size={13} /> {copiado ? '¡Enlace copiado!' : 'Copiar enlace para WhatsApp'}
              </button>
            </div>
          )}

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
