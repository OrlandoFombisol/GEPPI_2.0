import { useState, useEffect } from 'react'
import { Loader2, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal } from 'lucide-react'
import { movimientoDB }                  from '@/db'
import { TIPO_MOVIMIENTO, TIPO_MOVIMIENTO_LABEL } from '@/constants'
import { formatearFechaHora }            from '@/utils/dates'
import { formatearPesos }                from '@/utils/formatters'
import { Badge, Modal, Button }          from '@/components/ui'

// Ícono por tipo
const TIPO_ICONO = {
  [TIPO_MOVIMIENTO.ENTRADA]: { Icon: ArrowDownCircle, cls: 'text-green-600' },
  [TIPO_MOVIMIENTO.SALIDA]:  { Icon: ArrowUpCircle,   cls: 'text-blue-600'  },
  [TIPO_MOVIMIENTO.AJUSTE]:  { Icon: SlidersHorizontal, cls: 'text-orange-600' },
}

// Badge variant por tipo
const TIPO_VARIANT = {
  [TIPO_MOVIMIENTO.ENTRADA]: 'success',
  [TIPO_MOVIMIENTO.SALIDA]:  'info',
  [TIPO_MOVIMIENTO.AJUSTE]:  'warning',
}

export default function KardexModal({ registro, eppNombre, sedeNombre, onClose }) {
  const [movimientos, setMovimientos] = useState([])
  const [cargando,    setCargando]    = useState(true)

  useEffect(() => {
    if (registro?.eppId && registro?.sedeId) cargar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registro?.eppId, registro?.sedeId])

  async function cargar() {
    setCargando(true)
    try {
      const data = await movimientoDB.getPorEppYSede(registro.eppId, registro.sedeId)
      setMovimientos(data || [])
    } finally {
      setCargando(false)
    }
  }

  const totEntradas = movimientos
    .filter(m => m.tipo === TIPO_MOVIMIENTO.ENTRADA)
    .reduce((s, m) => s + m.cantidad, 0)
  const totSalidas  = movimientos
    .filter(m => m.tipo === TIPO_MOVIMIENTO.SALIDA)
    .reduce((s, m) => s + m.cantidad, 0)

  return (
    <Modal
      open
      onClose={onClose}
      title="Kardex de inventario"
      size="xl"
      footer={<Button variant="secondary" onClick={onClose}>Cerrar</Button>}
    >
      <div className="space-y-4">

        {/* Header del EPP */}
        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-base truncate">{eppNombre}</h3>
            <p className="text-sm text-slate-500 mt-0.5">{sedeNombre}</p>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-xs text-slate-400">Stock actual</p>
              <p className="text-2xl font-black tabular-nums text-slate-800">{registro?.stockActual ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-green-600">Total entradas</p>
              <p className="text-xl font-bold tabular-nums text-green-700">{totEntradas}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600">Total salidas</p>
              <p className="text-xl font-bold tabular-nums text-blue-700">{totSalidas}</p>
            </div>
          </div>
        </div>

        {/* Tabla de movimientos */}
        {cargando ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="animate-spin text-primary-600" />
          </div>
        ) : movimientos.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            Sin movimientos registrados para este EPP en esta sede.
          </p>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs">
                <thead className="sticky top-0">
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Fecha', 'Tipo', 'Cantidad', 'Saldo anterior', 'Saldo nuevo', 'Proveedor / Ref.', 'Motivo'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-slate-600 font-semibold uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m, i) => {
                    const { Icon, cls } = TIPO_ICONO[m.tipo] || TIPO_ICONO[TIPO_MOVIMIENTO.AJUSTE]
                    const signo = m.tipo === TIPO_MOVIMIENTO.ENTRADA ? '+' :
                                  m.tipo === TIPO_MOVIMIENTO.SALIDA  ? '-' : '±'
                    return (
                      <tr key={m.id ?? i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="px-3 py-2.5 text-slate-600 font-mono whitespace-nowrap">
                          {formatearFechaHora(m.fecha)}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <Icon size={12} className={cls} />
                            <Badge variant={TIPO_VARIANT[m.tipo] || 'neutral'}>
                              {TIPO_MOVIMIENTO_LABEL[m.tipo] || m.tipo}
                            </Badge>
                          </div>
                        </td>
                        <td className={[
                          'px-3 py-2.5 font-bold tabular-nums',
                          m.tipo === TIPO_MOVIMIENTO.ENTRADA ? 'text-green-700' :
                          m.tipo === TIPO_MOVIMIENTO.SALIDA  ? 'text-blue-700'  : 'text-orange-700',
                        ].join(' ')}>
                          {signo}{m.cantidad}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 tabular-nums">{m.saldoAnterior}</td>
                        <td className="px-3 py-2.5 text-slate-800 font-semibold tabular-nums">{m.saldoPosterior}</td>
                        <td className="px-3 py-2.5 text-slate-500 max-w-[140px] truncate">
                          {m.proveedor || m.referenciaEntregaId && `Entrega #${m.referenciaEntregaId}` || '—'}
                          {m.costoUnitario ? ` · ${formatearPesos(m.costoUnitario)}` : ''}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 max-w-[150px] truncate">
                          {m.motivoAjuste || m.observacion || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
