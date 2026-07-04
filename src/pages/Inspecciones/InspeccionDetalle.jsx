import { useRef } from 'react'
import { ChevronLeft, Printer, CheckCircle2, XCircle, MinusCircle, AlertTriangle } from 'lucide-react'
import { calcularCumplimiento, TIPOS_INSPECCION } from './items'

const RESULTADO_ICON = {
  CUMPLE:    { Icon: CheckCircle2, cls: 'text-green-600' },
  NO_CUMPLE: { Icon: XCircle,      cls: 'text-red-600'   },
  NO_APLICA: { Icon: MinusCircle,  cls: 'text-slate-400' },
}

function FilaItem({ item }) {
  const { Icon, cls } = RESULTADO_ICON[item.resultado] || RESULTADO_ICON.NO_APLICA
  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-start gap-3">
        <Icon size={18} className={`mt-0.5 flex-shrink-0 ${cls}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-800">{item.label}</p>
          {item.resultado === 'NO_CUMPLE' && (
            <div className="mt-1.5 pl-0">
              {item.accionTipo && (
                <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 mr-2">
                  {item.accionTipo}
                </span>
              )}
              {item.accionDescripcion && (
                <p className="text-xs text-slate-500 mt-1">{item.accionDescripcion}</p>
              )}
            </div>
          )}
        </div>
        <span className={`text-xs font-semibold flex-shrink-0 ${cls}`}>
          {item.resultado === 'CUMPLE' ? 'Cumple' : item.resultado === 'NO_CUMPLE' ? 'No cumple' : 'No aplica'}
        </span>
      </div>
    </div>
  )
}

export default function InspeccionDetalle({ inspeccion, onVolver }) {
  const printRef = useRef(null)
  if (!inspeccion) return null

  const tipoMeta   = TIPOS_INSPECCION.find(t => t.value === inspeccion.tipo) || {}
  const items      = inspeccion.items || []
  const pct        = calcularCumplimiento(items)
  const noCumplen  = items.filter(i => i.resultado === 'NO_CUMPLE')
  const fechaFmt   = inspeccion.fecha
    ? new Date(inspeccion.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  const colorPct = pct >= 85 ? '#16A34A' : pct >= 60 ? '#D97706' : '#DC2626'

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=800,height=900')
    w.document.write(`
<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Informe Inspección — ${tipoMeta.label || inspeccion.tipo}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1e293b; padding: 32px; }
  h1 { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
  .subtitle { color: #64748b; font-size: 12px; margin-bottom: 24px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; }
  .meta-item label { font-size: 11px; color: #64748b; display: block; }
  .meta-item span  { font-weight: 600; }
  .cumplimiento { text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
  .pct-number { font-size: 48px; font-weight: 800; color: ${colorPct}; }
  .pct-label  { font-size: 12px; color: #64748b; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #f1f5f9; font-size: 11px; text-align: left; padding: 8px 10px; border-bottom: 2px solid #e2e8f0; }
  td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; vertical-align: top; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .cumple   { background:#dcfce7; color:#166534; }
  .nocumple { background:#fee2e2; color:#991b1b; }
  .noaplica { background:#f1f5f9; color:#64748b; }
  .accion-badge { background:#ffedd5; color:#9a3412; display:inline-block; padding:1px 6px; border-radius:999px; font-size:10px; font-weight:600; margin-right:4px; }
  .obs { background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:12px; margin-top:8px; }
  .footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
  @media print { body { padding: 16px; } }
</style></head><body>
<h1>${tipoMeta.emoji || ''} Informe de Inspección: ${tipoMeta.label || inspeccion.tipo}</h1>
<p class="subtitle">GEPPI — Sistema de Gestión en Seguridad y Salud en el Trabajo</p>

<div class="meta-grid">
  <div class="meta-item"><label>Empresa</label><span>${inspeccion.empresa?.razon_social || '—'}</span></div>
  <div class="meta-item"><label>Fecha</label><span>${fechaFmt}</span></div>
  <div class="meta-item"><label>Inspector</label><span>${inspeccion.inspector || '—'}</span></div>
  <div class="meta-item"><label>Sede</label><span>${inspeccion.empresa?.ciudad || '—'}</span></div>
</div>

<div class="cumplimiento">
  <div class="pct-number">${pct}%</div>
  <div class="pct-label">Índice de cumplimiento</div>
  <div style="font-size:11px;color:#64748b;margin-top:4px">
    ${items.filter(i=>i.resultado==='CUMPLE').length} Cumple ·
    ${noCumplen.length} No cumple ·
    ${items.filter(i=>i.resultado==='NO_APLICA').length} No aplica
  </div>
</div>

${inspeccion.fotoBase64 ? `<div style="text-align:center;margin-bottom:20px"><img src="${inspeccion.fotoBase64}" style="max-width:320px;max-height:220px;border-radius:8px;border:1px solid #e2e8f0;" /></div>` : ''}

<table>
  <thead><tr><th>#</th><th>Ítem</th><th>Resultado</th><th>Acción a implementar</th></tr></thead>
  <tbody>
    ${items.map((item, i) => `
    <tr>
      <td style="color:#94a3b8;width:28px">${i + 1}</td>
      <td>${item.label}</td>
      <td>
        <span class="badge ${item.resultado==='CUMPLE'?'cumple':item.resultado==='NO_CUMPLE'?'nocumple':'noaplica'}">
          ${item.resultado==='CUMPLE'?'Cumple':item.resultado==='NO_CUMPLE'?'No cumple':'No aplica'}
        </span>
      </td>
      <td>
        ${item.accionTipo ? `<span class="accion-badge">${item.accionTipo}</span>` : ''}
        ${item.accionDescripcion || ''}
      </td>
    </tr>`).join('')}
  </tbody>
</table>

${inspeccion.observacionGeneral ? `<div class="obs"><strong>Observación general:</strong><br>${inspeccion.observacionGeneral}</div>` : ''}

<div class="footer">
  <span>GEPPI v2.0 — Generado el ${new Date().toLocaleString('es-CO')}</span>
  <span>___________________________________<br>Firma Inspector</span>
</div>
</body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print(); w.close() }, 400)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white flex-shrink-0">
        <button onClick={onVolver} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">
            {tipoMeta.emoji} Inspección de {tipoMeta.label || inspeccion.tipo}
          </p>
          <p className="text-xs text-slate-500">{fechaFmt} · {inspeccion.inspector}</p>
        </div>
        <button onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-semibold transition-colors">
          <Printer size={14} /> Imprimir
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" ref={printRef}>
        <div className="max-w-2xl mx-auto p-4 space-y-4">

          {/* Resumen de cumplimiento */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-5">
              <div className="text-center flex-shrink-0">
                <p className="text-4xl font-black" style={{ color: colorPct }}>{pct}%</p>
                <p className="text-xs text-slate-500 font-medium">Cumplimiento</p>
              </div>
              <div className="flex-1 space-y-2">
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: colorPct }} />
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle2 size={12} /> {items.filter(i => i.resultado === 'CUMPLE').length} cumple
                  </span>
                  <span className="flex items-center gap-1 text-red-600 font-medium">
                    <XCircle size={12} /> {noCumplen.length} no cumple
                  </span>
                  <span className="flex items-center gap-1 text-slate-400 font-medium">
                    <MinusCircle size={12} /> {items.filter(i => i.resultado === 'NO_APLICA').length} no aplica
                  </span>
                </div>
              </div>
            </div>

            {noCumplen.length > 0 && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-700">{noCumplen.length} ítem(s) no cumplen</p>
                  <p className="text-xs text-red-600">{noCumplen.map(i => i.label).join(', ')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Foto */}
          {inspeccion.fotoBase64 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <img src={inspeccion.fotoBase64} alt="Foto de evidencia"
                className="w-full max-h-64 object-cover" />
            </div>
          )}

          {/* Datos */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Datos de la inspección</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div><dt className="text-xs text-slate-400">Empresa</dt><dd className="font-medium">{inspeccion.empresa?.razon_social || '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Fecha</dt><dd className="font-medium">{fechaFmt}</dd></div>
              <div><dt className="text-xs text-slate-400">Inspector</dt><dd className="font-medium">{inspeccion.inspector || '—'}</dd></div>
              <div><dt className="text-xs text-slate-400">Ciudad</dt><dd className="font-medium">{inspeccion.empresa?.ciudad || '—'}</dd></div>
            </dl>
          </div>

          {/* Ítems */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Ítems inspeccionados</p>
            {items.map(item => <FilaItem key={item.id} item={item} />)}
          </div>

          {/* Observación */}
          {inspeccion.observacionGeneral && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Observación general</p>
              <p className="text-sm text-slate-700 leading-relaxed">{inspeccion.observacionGeneral}</p>
            </div>
          )}

          <div className="pb-8" />
        </div>
      </div>
    </div>
  )
}
