import { useState, useEffect } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { asignacionDB, eppDB, inventarioDB } from '@/db'
import { calcularFechaVencimiento, toISODate, formatearFecha } from '@/utils/dates'
import { AlertBanner, Button }               from '@/components/ui'

export default function Paso2EPP({ trabajador, cargo, eppItemsInicial, onNext, onAnterior }) {
  const [items,    setItems]    = useState(eppItemsInicial || [])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (eppItemsInicial?.length) { setCargando(false); return }
    cargarEPP()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function cargarEPP() {
    setCargando(true)
    try {
      const [asigs, todosEPP, invSede] = await Promise.all([
        asignacionDB.getEppPorCargo(cargo.id),
        eppDB.getAll(),
        inventarioDB.getPorSede(trabajador.sedeId),
      ])

      const eppMap = Object.fromEntries((todosEPP || []).map(e => [e.id, e]))
      const invMap = Object.fromEntries((invSede  || []).map(i => [i.eppId, i]))

      const hoy = new Date()
      const construidos = (asigs || [])
        .filter(a => a.vigente !== false && eppMap[a.eppId])
        .map(a => {
          const epp  = eppMap[a.eppId]
          const inv  = invMap[a.eppId]
          const fv   = calcularFechaVencimiento(hoy, epp.vidaUtilDias)
          const stock = inv?.stockActual ?? 0
          return {
            eppId:            a.eppId,
            eppNombre:        epp.nombre,
            eppItem:          epp.item,
            vidaUtilDias:     epp.vidaUtilDias,
            vidaUtil:         epp.vidaUtil || '',
            disposicionFinal: epp.disposicionFinal || '',
            normaAplicable:   epp.normaAplicable   || '',
            stockActual:      stock,
            fechaVencimiento: fv ? toISODate(fv) : null,
            cantidad:         1,
            incluido:         stock > 0,
          }
        })
        .sort((a, b) => a.eppItem - b.eppItem)

      setItems(construidos)
    } finally {
      setCargando(false)
    }
  }

  const toggle = eppId =>
    setItems(prev => prev.map(i => i.eppId === eppId ? { ...i, incluido: !i.incluido } : i))

  const setCantidad = (eppId, val) =>
    setItems(prev => prev.map(i => {
      if (i.eppId !== eppId) return i
      const c = Math.max(1, Math.min(val || 1, Math.max(i.stockActual, 1)))
      return { ...i, cantidad: c }
    }))

  const incluidos    = items.filter(i => i.incluido)
  const sinStock     = incluidos.filter(i => i.stockActual === 0)
  const puedeAvanzar = incluidos.length > 0

  if (cargando) return (
    <div className="flex justify-center py-16">
      <Loader2 size={28} className="animate-spin text-primary-600" />
    </div>
  )

  if (items.length === 0) return (
    <div className="space-y-4">
      <AlertBanner level="warning"
        message={`El cargo "${cargo?.nombre}" no tiene EPP asignados en la Matriz por Cargos.`} />
      <Button variant="secondary" onClick={onAnterior}>← Anterior</Button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-800">
          EPP del cargo: <span className="text-primary-700">{cargo?.nombre}</span>
        </h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Selecciona los EPP a entregar y ajusta las cantidades.
        </p>
      </div>

      {sinStock.length > 0 && (
        <AlertBanner level="warning"
          message={`${sinStock.length} EPP sin stock en esta sede. Se deseleccionaron automáticamente.`} />
      )}

      {/* Tabla de EPP */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-2.5 w-10" />
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">EPP</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide w-24">Disponible</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide w-24">Cantidad</th>
              <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wide w-32">Vence</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr
                key={item.eppId}
                onClick={() => item.stockActual > 0 && toggle(item.eppId)}
                className={[
                  'border-b border-slate-100 last:border-0 transition-colors',
                  item.incluido ? 'bg-primary-50/40 hover:bg-primary-50' : 'hover:bg-slate-50',
                  item.stockActual === 0 ? 'opacity-50' : 'cursor-pointer',
                ].join(' ')}
              >
                {/* Checkbox */}
                <td className="px-3 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={item.incluido}
                    disabled={item.stockActual === 0}
                    onChange={() => toggle(item.eppId)}
                    onClick={e => e.stopPropagation()}
                    className="w-4 h-4 rounded accent-primary-700 cursor-pointer"
                  />
                </td>
                {/* Nombre */}
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-slate-200 text-slate-600 text-[10px] font-bold
                                     flex items-center justify-center flex-shrink-0">
                      {String(item.eppItem).padStart(2,'0')}
                    </span>
                    <span className="text-slate-800 font-medium line-clamp-2 leading-snug">
                      {item.eppNombre}
                    </span>
                  </div>
                </td>
                {/* Stock */}
                <td className="px-3 py-2.5 text-center">
                  {item.stockActual === 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                      <AlertTriangle size={11} /> Sin stock
                    </span>
                  ) : (
                    <span className="text-green-700 font-semibold tabular-nums">{item.stockActual}</span>
                  )}
                </td>
                {/* Cantidad */}
                <td className="px-3 py-2.5 text-center" onClick={e => e.stopPropagation()}>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(item.stockActual, 1)}
                    value={item.cantidad}
                    disabled={!item.incluido}
                    onChange={e => setCantidad(item.eppId, Number(e.target.value))}
                    className="w-14 h-7 text-center rounded-md border border-slate-300 text-sm
                               disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </td>
                {/* Fecha vencimiento */}
                <td className="px-3 py-2.5 text-center text-xs text-slate-500 font-mono">
                  {item.fechaVencimiento ? formatearFecha(item.fechaVencimiento) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        {incluidos.length} EPP seleccionado{incluidos.length !== 1 ? 's' : ''} para esta entrega.
      </p>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onAnterior}>← Anterior</Button>
        <Button onClick={() => onNext({ eppItems: incluidos })} disabled={!puedeAvanzar}>
          Siguiente →
        </Button>
      </div>
    </div>
  )
}
