import { useState } from 'react'
import { formatearFecha }        from '@/utils/dates'
import { TEXTO_LEGAL_ENTREGA }   from '@/constants'
import { Button, AlertBanner }   from '@/components/ui'

// Responsable fijo de entrega EPP — ajustar nomenclatura aquí cuando se defina
const RESPONSABLE_ENTREGA = 'JAIR MENDOZA PEREZ'

export default function Paso4Confirmar({
  trabajador, cargo, eppItems, firmaBase64,
  onConfirmar, onAnterior, saving,
}) {
  const [observaciones, setObservaciones] = useState('')
  const [error,         setError]         = useState('')

  const handleConfirmar = async () => {
    setError('')
    await onConfirmar({ responsable: RESPONSABLE_ENTREGA, observaciones: observaciones.trim() })
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-slate-800">Confirmar entrega</h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Revisa los datos antes de registrar la entrega de forma definitiva.
        </p>
      </div>

      {/* Resumen del trabajador */}
      <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Trabajador</p>
        <p className="font-bold text-slate-900">{trabajador.nombres} {trabajador.apellidos}</p>
        <p className="text-sm text-slate-500 mt-0.5">
          CC {trabajador.cedula} · {cargo?.nombre || '—'} · {trabajador.sedeNombre || trabajador.sedeId}
        </p>
      </div>

      {/* Lista de EPP */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
          EPP a entregar ({eppItems.length})
        </p>
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['#', 'EPP', 'Cantidad', 'Vence'].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-slate-600 font-semibold uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {eppItems.map(item => (
                <tr key={item.eppId} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 text-slate-400 font-mono">{String(item.eppItem).padStart(2,'0')}</td>
                  <td className="px-3 py-2 text-slate-800 font-medium">{item.eppNombre}</td>
                  <td className="px-3 py-2 text-slate-700 tabular-nums font-bold">{item.cantidad}</td>
                  <td className="px-3 py-2 text-slate-500 font-mono">
                    {item.fechaVencimiento ? formatearFecha(item.fechaVencimiento) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Firma capturada */}
      {firmaBase64 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Firma capturada</p>
          <div className="border border-slate-200 rounded-xl p-2 bg-white inline-block">
            <img src={firmaBase64} alt="Firma digital" className="h-16 max-w-full object-contain" />
          </div>
        </div>
      )}

      {/* Responsable fijo + Observaciones */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">
            Responsable de entrega
          </label>
          <div className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center
                          text-sm font-semibold text-slate-700 tracking-wide">
            {RESPONSABLE_ENTREGA}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Observaciones</label>
          <input
            type="text"
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            placeholder="Notas adicionales (opcional)"
            className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm text-slate-900
                       focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {error && <AlertBanner level="danger" message={error} />}

      {/* Texto legal */}
      <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-50 border border-slate-100 rounded-lg p-3">
        {TEXTO_LEGAL_ENTREGA}
      </p>

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onAnterior} disabled={saving}>← Anterior</Button>
        <Button onClick={handleConfirmar} loading={saving}>
          Confirmar y registrar entrega
        </Button>
      </div>
    </div>
  )
}
