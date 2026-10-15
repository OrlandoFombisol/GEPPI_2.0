import { useState, useEffect } from 'react'
import { Loader2, Package, CheckCircle2, AlertTriangle, XCircle, QrCode } from 'lucide-react'
import {
  entregaDB, detalleEntregaDB,
  asignacionDB, eppDB,
} from '@/db'
import { ESTADO_EPP, ESTADO_EPP_LABEL, ESTADO_ENTREGA_LABEL, TIPO_CONTRATO } from '@/constants'
import { calcularEstadoEPP, formatearFecha, textoVencimiento } from '@/utils/dates'
import { obtenerIniciales } from '@/utils/formatters'
import { Badge, Modal, StatusDot, Button } from '@/components/ui'
import ModalTarjetaQR from './TarjetaQRModal'

// ─── Helpers visuales ─────────────────────────────────────────────────────────

const CONTRATO_LABEL = Object.fromEntries(TIPO_CONTRATO.map(t => [t.value, t.label]))

function AvatarWorker({ nombres, apellidos }) {
  const iniciales = obtenerIniciales(`${nombres} ${apellidos}`)
  return (
    <div className="w-14 h-14 rounded-2xl bg-primary-700 flex items-center justify-center flex-shrink-0">
      <span className="text-white text-xl font-bold tracking-wide">{iniciales}</span>
    </div>
  )
}

function ChipEstado({ estado }) {
  const cfg = {
    [ESTADO_EPP.VIGENTE]:        { variant: 'success', icon: <CheckCircle2 size={11} /> },
    [ESTADO_EPP.PROXIMO_VENCER]: { variant: 'warning', icon: <AlertTriangle size={11} /> },
    [ESTADO_EPP.VENCIDO]:        { variant: 'danger',  icon: <XCircle      size={11} /> },
    [ESTADO_EPP.SIN_ENTREGA]:    { variant: 'neutral', icon: <Package      size={11} /> },
  }
  const { variant, icon } = cfg[estado] || cfg[ESTADO_EPP.SIN_ENTREGA]
  return (
    <Badge variant={variant}>
      <span className="flex items-center gap-1">{icon}{ESTADO_EPP_LABEL[estado]}</span>
    </Badge>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function TrabajadorPerfil({ trabajador, cargoNombre, sedeNombre, onClose }) {
  const [eppItems,   setEppItems]   = useState([])   // [{ epp, estado, detalle }]
  const [entregas,   setEntregas]   = useState([])
  const [cargando,   setCargando]   = useState(true)
  const [mostrarQR,  setMostrarQR]  = useState(false)

  useEffect(() => {
    if (trabajador?.id) cargarDatos()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trabajador?.id])

  async function cargarDatos() {
    setCargando(true)
    try {
      // 1. EPP asignados al cargo
      const asignaciones = trabajador.cargoId
        ? await asignacionDB.getEppPorCargo(trabajador.cargoId)
        : []
      const todosEPP = await eppDB.getAll()
      const eppMap   = Object.fromEntries(todosEPP.map(e => [e.id, e]))

      // 2. Todas las entregas firmadas del trabajador
      const todasEntregas = await entregaDB.getEntregasPorTrabajador(trabajador.id)
      setEntregas(todasEntregas || [])

      const firmadas   = (todasEntregas || []).filter(e => e.estado === 'FIRMADA')
      const idsEntrega = firmadas.map(e => e.id)

      // 3. Todos los detalles de esas entregas (2 queries total)
      const detallesArr = await Promise.all(
        idsEntrega.map(id => detalleEntregaDB.getPorEntrega(id))
      )
      const detallesFlat = detallesArr.flat()

      // Último detalle por EPP (mayor fechaVencimiento)
      const ultimoPorEpp = {}
      for (const d of detallesFlat) {
        const prev = ultimoPorEpp[d.eppId]
        if (!prev || (d.fechaVencimiento > prev.fechaVencimiento)) {
          ultimoPorEpp[d.eppId] = d
        }
      }

      // 4. Construir lista con estado semáforo
      const items = asignaciones
        .filter(a => a.vigente !== false && eppMap[a.eppId])
        .map(a => {
          const epp     = eppMap[a.eppId]
          const detalle = ultimoPorEpp[a.eppId] || null
          const estado  = calcularEstadoEPP(detalle?.fechaVencimiento)
          return { epp, estado, detalle }
        })
        .sort((a, b) => {
          const order = { VENCIDO: 0, PROXIMO_VENCER: 1, SIN_ENTREGA: 2, VIGENTE: 3 }
          return (order[a.estado] ?? 4) - (order[b.estado] ?? 4)
        })

      setEppItems(items)
    } finally {
      setCargando(false)
    }
  }

  // Contadores de estado
  const vigentes   = eppItems.filter(i => i.estado === ESTADO_EPP.VIGENTE).length
  const vencidos   = eppItems.filter(i => i.estado === ESTADO_EPP.VENCIDO).length
  const proximos   = eppItems.filter(i => i.estado === ESTADO_EPP.PROXIMO_VENCER).length
  const sinEntregar= eppItems.filter(i => i.estado === ESTADO_EPP.SIN_ENTREGA).length

  const nombre = `${trabajador.nombres} ${trabajador.apellidos}`

  return (
    <>
    {mostrarQR && (
      <ModalTarjetaQR
        trabajador={trabajador}
        cargoNombre={cargoNombre}
        sedeNombre={sedeNombre}
        onClose={() => setMostrarQR(false)}
      />
    )}
    <Modal
      open
      onClose={onClose}
      title="Perfil del trabajador"
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button variant="outline" onClick={() => setMostrarQR(true)}
            className="flex items-center gap-2">
            <QrCode size={15} /> Tarjeta QR
          </Button>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </div>
      }
    >
      <div className="space-y-5">

        {/* ── Tarjeta de identidad ── */}
        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <AvatarWorker nombres={trabajador.nombres} apellidos={trabajador.apellidos} />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-base truncate">{nombre}</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {cargoNombre || '—'} · {sedeNombre || '—'}
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs text-slate-500">
              <span><strong>Cédula:</strong> {trabajador.cedula}</span>
              <span><strong>Ingreso:</strong> {formatearFecha(trabajador.fechaIngreso)}</span>
              <span><strong>Contrato:</strong> {CONTRATO_LABEL[trabajador.tipoContrato] || trabajador.tipoContrato}</span>
              {trabajador.correo  && <span><strong>Correo:</strong> {trabajador.correo}</span>}
              {trabajador.telefono && <span><strong>Tel:</strong> {trabajador.telefono}</span>}
            </div>
          </div>
          <Badge variant={trabajador.estado === 'ACTIVO' ? 'success' : 'neutral'}>
            {trabajador.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        {/* ── Semáforo resumen ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'EPP vigentes',          val: vigentes,    cls: 'bg-green-50 text-green-800 border-green-200'   },
            { label: 'Próximos a vencer',     val: proximos,    cls: 'bg-yellow-50 text-yellow-800 border-yellow-200'},
            { label: 'Vencidos',              val: vencidos,    cls: 'bg-red-50 text-red-800 border-red-200'         },
            { label: 'Sin primera entrega',   val: sinEntregar, cls: 'bg-slate-50 text-slate-700 border-slate-200'   },
          ].map(({ label, val, cls }) => (
            <div key={label} className={['rounded-xl border px-4 py-3 text-center', cls].join(' ')}>
              <p className="text-2xl font-bold tabular-nums">{val}</p>
              <p className="text-xs font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── EPP del cargo ── */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">
            EPP asignados al cargo ({eppItems.length})
          </h4>

          {cargando ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary-600" />
            </div>
          ) : eppItems.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">
              No hay EPP asignados a este cargo.
            </p>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-3 py-2.5 text-left text-slate-600 font-semibold uppercase tracking-wide">#</th>
                    <th className="px-3 py-2.5 text-left text-slate-600 font-semibold uppercase tracking-wide">EPP</th>
                    <th className="px-3 py-2.5 text-left text-slate-600 font-semibold uppercase tracking-wide">Estado</th>
                    <th className="px-3 py-2.5 text-left text-slate-600 font-semibold uppercase tracking-wide">Vencimiento</th>
                    <th className="px-3 py-2.5 text-left text-slate-600 font-semibold uppercase tracking-wide">Tiempo</th>
                  </tr>
                </thead>
                <tbody>
                  {eppItems.map(({ epp, estado, detalle }) => (
                    <tr key={epp.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-3 py-2.5 text-slate-400 font-mono">{epp.item}</td>
                      <td className="px-3 py-2.5 text-slate-800 font-medium max-w-[200px] truncate">
                        <div className="flex items-center gap-2">
                          <StatusDot status={estado} size="sm" />
                          {epp.nombre}
                        </div>
                      </td>
                      <td className="px-3 py-2.5"><ChipEstado estado={estado} /></td>
                      <td className="px-3 py-2.5 text-slate-600 font-mono">
                        {detalle?.fechaVencimiento ? formatearFecha(detalle.fechaVencimiento) : '—'}
                      </td>
                      <td className={[
                        'px-3 py-2.5 font-medium',
                        estado === ESTADO_EPP.VENCIDO       ? 'text-red-600'    :
                        estado === ESTADO_EPP.PROXIMO_VENCER ? 'text-yellow-700' :
                        estado === ESTADO_EPP.VIGENTE        ? 'text-green-700'  : 'text-slate-400',
                      ].join(' ')}>
                        {detalle?.fechaVencimiento ? textoVencimiento(detalle.fechaVencimiento) : 'Sin entrega'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Historial de entregas ── */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">
            Últimas entregas ({entregas.length})
          </h4>
          {entregas.length === 0 ? (
            <p className="text-sm text-slate-400 py-2 text-center">Sin entregas registradas.</p>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-3 py-2.5 text-left text-slate-600 font-semibold uppercase tracking-wide">Fecha entrega</th>
                    <th className="px-3 py-2.5 text-left text-slate-600 font-semibold uppercase tracking-wide">Estado</th>
                    <th className="px-3 py-2.5 text-left text-slate-600 font-semibold uppercase tracking-wide">Acta N°</th>
                  </tr>
                </thead>
                <tbody>
                  {entregas.slice(0, 8).map(e => (
                    <tr key={e.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-3 py-2.5 text-slate-700 font-mono">
                        {formatearFecha(e.fechaEntrega)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant={
                          e.estado === 'FIRMADA'   ? 'firmada'  :
                          e.estado === 'PENDIENTE' ? 'pendiente': 'anulada'
                        }>
                          {ESTADO_ENTREGA_LABEL?.[e.estado] || e.estado}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 font-mono text-[10px]">
                        {e.numeroActa || `#${e.id}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </Modal>
    </>
  )
}
