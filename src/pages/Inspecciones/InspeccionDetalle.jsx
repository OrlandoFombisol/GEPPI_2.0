import { motion } from 'framer-motion'
import { X, Printer, CheckCircle2, XCircle, MinusCircle, AlertTriangle, Shield } from 'lucide-react'
import { calcularCumplimiento, TIPOS_INSPECCION } from './items'

function RingPct({ pct, size = 96 }) {
  const stroke = 8
  const r      = (size - stroke * 2) / 2
  const circ   = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  const color  = pct >= 85 ? '#16A34A' : pct >= 60 ? '#D97706' : '#DC2626'
  const label  = pct >= 85 ? 'APROBADO' : pct >= 60 ? 'PARCIAL' : 'CRÍTICO'
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke="white" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.0, ease: 'easeOut', delay: 0.3 }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          style={{ fontSize: 22, fontWeight: 900, color: 'white', lineHeight: 1 }}>{pct}%</motion.span>
        <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.12em', marginTop: 2 }}>{label}</span>
      </div>
    </div>
  )
}

function FilaItem({ item }) {
  const cfg = {
    CUMPLE:    { Icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', label: 'Cumple'    },
    NO_CUMPLE: { Icon: XCircle,      bg: 'bg-red-50',     border: 'border-red-100',     text: 'text-red-700',     badge: 'bg-red-100 text-red-700',         label: 'No cumple' },
    NO_APLICA: { Icon: MinusCircle,  bg: 'bg-slate-50',   border: 'border-slate-100',   text: 'text-slate-400',   badge: 'bg-slate-100 text-slate-500',     label: 'No aplica' },
  }
  const c = cfg[item.resultado] || cfg.NO_APLICA
  return (
    <div className={`flex items-start gap-3 p-2.5 rounded-xl border ${c.bg} ${c.border} mb-1.5`}>
      <c.Icon size={15} className={`mt-0.5 flex-shrink-0 ${c.text}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 font-medium leading-snug">{item.label}</p>
        {item.resultado === 'NO_CUMPLE' && (
          <div className="flex flex-wrap gap-1.5 items-center mt-1">
            {item.accionTipo && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{item.accionTipo}</span>}
            {item.accionDescripcion && <span className="text-xs text-slate-500 italic">{item.accionDescripcion}</span>}
          </div>
        )}
      </div>
      <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>{c.label}</span>
    </div>
  )
}

const ITEMS_EXTINTOR_LABELS = {
  A: 'Ubicado en lugar designado y accesible',
  B: 'Señalización visible',
  C: 'Acceso libre de obstáculos',
  D: 'Precintos y sellos en buen estado',
  E: 'Pasador de seguridad en su lugar',
  F: 'Presión correcta (manómetro verde)',
  G: 'Manómetro en buen estado',
  H: 'Manguera y boquilla en buen estado',
  I: 'Cilindro sin golpes ni corrosión',
  J: 'Instrucciones de operación visibles',
  K: 'Tarjeta de inspección al día',
  L: 'Mango y palanca en buen estado',
  M: 'Válvula en posición de operación',
}
const ITEM_IDS = ['A','B','C','D','E','F','G','H','I','J','K','L','M']

export default function InspeccionDetalle({ inspeccion, onVolver }) {
  if (!inspeccion) return null

  const tipoMeta       = TIPOS_INSPECCION.find(t => t.value === inspeccion.tipo) || {}
  const items          = inspeccion.items || []
  const isExtintoresNew = inspeccion.tipo === 'EXTINTORES' && items[0]?.extintorId !== undefined
  const pct            = calcularCumplimiento(items)
  const color          = tipoMeta.color || '#1b62cc'
  const fechaFmt       = inspeccion.fecha
    ? new Date(inspeccion.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'
  const mesFmt         = inspeccion.fecha
    ? new Date(inspeccion.fecha + 'T12:00:00').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    : '—'
  const colorPct  = pct >= 85 ? '#16A34A' : pct >= 60 ? '#D97706' : '#DC2626'
  const labelPct  = pct >= 85 ? 'APROBADO' : pct >= 60 ? 'PARCIAL' : 'CRÍTICO'

  // Stats for regular format
  const noCumplen = isExtintoresNew ? [] : items.filter(i => i.resultado === 'NO_CUMPLE')
  const cumplen   = isExtintoresNew ? [] : items.filter(i => i.resultado === 'CUMPLE')
  const noAplica  = isExtintoresNew ? [] : items.filter(i => i.resultado === 'NO_APLICA')

  // Stats for extintores format
  const extStats = isExtintoresNew ? (() => {
    let c = 0, nc = 0, na = 0
    for (const ext of items) {
      for (const v of Object.values(ext.resultados || {})) {
        if (v.resultado === 'CUMPLE') c++
        else if (v.resultado === 'NO_CUMPLE') nc++
        else na++
      }
    }
    return { c, nc, na }
  })() : null

  const handlePrintExtintores = () => {
    const w = window.open('', '_blank', 'width=1200,height=900')
    const empresa = inspeccion.empresa?.razon_social || '—'
    const observaciones = []
    items.forEach(ext => {
      ITEM_IDS.forEach(id => {
        const r = ext.resultados?.[id]
        if (r?.resultado === 'NO_CUMPLE' && r.observacion)
          observaciones.push(`Ext.#${ext.numero} ítem ${id}: ${r.observacion}`)
      })
    })
    const cellColor = v => v === 'CUMPLE' ? '#dcfce7' : v === 'NO_CUMPLE' ? '#fee2e2' : '#f1f5f9'
    const cellText  = v => v === 'CUMPLE' ? '#15803d' : v === 'NO_CUMPLE' ? '#991b1b' : '#64748b'
    const cellLabel = v => v === 'CUMPLE' ? 'C' : v === 'NO_CUMPLE' ? 'NC' : 'NA'
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Inspección Extintores — ${empresa}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1e293b}
.hdr{background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;padding:18px 28px;display:flex;justify-content:space-between;align-items:center}
.hdr h1{font-size:18px;font-weight:900;margin-bottom:3px}
.hdr p{font-size:11px;opacity:.75}
.box{background:rgba(255,255,255,0.15);border-radius:10px;padding:10px 18px;text-align:center;border:1px solid rgba(255,255,255,0.2);min-width:90px}
.box b{font-size:32px;font-weight:900;color:#fff;display:block;line-height:1}
.box small{font-size:9px;font-weight:700;letter-spacing:.12em;color:rgba(255,255,255,.65)}
.body{padding:16px 28px}
.meta{display:flex;gap:24px;flex-wrap:wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;margin-bottom:14px}
.m{min-width:130px}
.m label{font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;display:block}
.m span{font-weight:700;font-size:12px}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#1e293b;color:#fff;padding:5px 4px;text-align:center;font-weight:700}
th.left{text-align:left;padding-left:8px}
td{padding:4px;text-align:center;border:1px solid #e2e8f0;vertical-align:middle}
td.info{text-align:left;padding-left:8px;font-weight:600}
td.sub{font-size:10px;color:#64748b;font-weight:400}
tr:nth-child(even) td{background:#f8fafc}
.badge{display:inline-block;padding:1px 5px;border-radius:99px;font-size:10px;font-weight:700;width:26px}
.obs-list{margin-top:12px;background:#fff8f0;border:1px solid #fed7aa;border-radius:8px;padding:10px 14px}
.obs-list p{font-size:11px;margin-top:4px;color:#7c2d12}
h2{font-size:10px;font-weight:700;color:#64748b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #f1f5f9;margin-top:12px}
.legend{display:flex;gap:12px;margin-top:8px;font-size:10px}
.litem{display:flex;align-items:center;gap:4px}
.ldot{width:14px;height:14px;border-radius:3px;display:inline-block}
.foot{margin-top:20px;display:flex;justify-content:space-between;border-top:1px solid #e2e8f0;padding-top:12px}
.firma{border-top:2px solid #1e293b;padding-top:4px;font-size:10px;color:#64748b;text-align:center;margin-top:28px;width:180px}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:landscape A4;margin:12mm}}
</style></head><body>
<div class="hdr">
  <div>
    <p style="font-size:9px;opacity:.65;letter-spacing:.1em;text-transform:uppercase;margin-bottom:2px">GEPPI · SST</p>
    <h1>🧯 Inspección de Extintores</h1>
    <p>${empresa} &nbsp;·&nbsp; ${inspeccion.sede || '—'} &nbsp;·&nbsp; ${mesFmt}</p>
  </div>
  <div style="display:flex;gap:10px">
    <div class="box"><b>${pct}%</b><small>${labelPct}</small></div>
    <div class="box"><b>${extStats?.nc || 0}</b><small>NO CUMPLEN</small></div>
  </div>
</div>
<div class="body">
  <div class="meta">
    <div class="m"><label>Inspector</label><span>${inspeccion.inspector || '—'}</span></div>
    <div class="m"><label>Empresa</label><span>${empresa}</span></div>
    <div class="m"><label>Sede</label><span>${inspeccion.sede || '—'}</span></div>
    <div class="m"><label>Mes</label><span>${mesFmt}</span></div>
    <div class="m"><label>Extintores inspeccionados</label><span>${items.length}</span></div>
  </div>
  <h2>Resultado por extintor</h2>
  <div style="overflow-x:auto">
  <table>
    <thead>
      <tr>
        <th class="left" style="width:28px">#</th>
        <th class="left" style="min-width:70px">Tipo</th>
        <th class="left" style="min-width:90px">Ubicación</th>
        ${ITEM_IDS.map(id => `<th style="width:30px">${id}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${items.map(ext => `
      <tr>
        <td class="info">${ext.numero}</td>
        <td class="info">${ext.tipo || '—'}</td>
        <td class="sub">${ext.ubicacion || '—'}</td>
        ${ITEM_IDS.map(id => {
          const v = ext.resultados?.[id]?.resultado
          return `<td><span class="badge" style="background:${cellColor(v)};color:${cellText(v)}">${cellLabel(v)}</span></td>`
        }).join('')}
      </tr>`).join('')}
    </tbody>
  </table>
  </div>
  <div class="legend">
    <div class="litem"><span class="ldot" style="background:#dcfce7;border:1px solid #bbf7d0"></span> C = Cumple</div>
    <div class="litem"><span class="ldot" style="background:#fee2e2;border:1px solid #fecaca"></span> NC = No Cumple</div>
    <div class="litem"><span class="ldot" style="background:#f1f5f9;border:1px solid #e2e8f0"></span> NA = No Aplica</div>
  </div>
  ${observaciones.length > 0 ? `
  <div class="obs-list">
    <h2 style="border:none;margin:0 0 6px 0;color:#7c2d12">Observaciones (ítems No Cumple)</h2>
    ${observaciones.map(o => `<p>• ${o}</p>`).join('')}
  </div>` : ''}
  <div class="foot">
    <p style="font-size:10px;color:#94a3b8">GEPPI v2.0 · ${new Date().toLocaleString('es-CO')}</p>
    <div class="firma">Firma del Inspector</div>
  </div>
</div></body></html>`)
    w.document.close(); w.focus()
    setTimeout(() => { w.print(); w.close() }, 450)
  }

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=820,height=960')
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Informe — ${tipoMeta.label || inspeccion.tipo}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1e293b}
.hdr{background:linear-gradient(135deg,${color},${color}bb);color:#fff;padding:24px 32px;display:flex;justify-content:space-between;align-items:center}
.hdr h1{font-size:20px;font-weight:900;margin-bottom:2px}
.hdr p{font-size:11px;opacity:.75}
.ring-box{text-align:center;background:rgba(255,255,255,0.15);border-radius:12px;padding:12px 20px;border:1px solid rgba(255,255,255,0.2)}
.ring-pct{font-size:38px;font-weight:900;color:#fff}
.ring-lbl{font-size:9px;font-weight:700;letter-spacing:.14em;color:rgba(255,255,255,.65)}
.body{padding:20px 32px}
.meta{display:grid;grid-template-columns:repeat(2,1fr);gap:8px 24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;margin-bottom:16px}
.m label{font-size:10px;color:#94a3b8;display:block;text-transform:uppercase;letter-spacing:.06em}
.m span{font-weight:700}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}
.stat{text-align:center;padding:10px;border-radius:8px;border:1px solid #e2e8f0}
.stat b{font-size:22px;font-weight:900;display:block}
.stat small{font-size:10px;color:#94a3b8}
h2{font-size:11px;font-weight:700;color:#64748b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #f1f5f9}
.row{display:flex;gap:10px;padding:7px 10px;border-radius:7px;margin-bottom:3px;border:1px solid transparent}
.row.cumple{background:#f0fdf4;border-color:#bbf7d0}
.row.nc{background:#fef2f2;border-color:#fecaca}
.row.na{background:#f8fafc;border-color:#e2e8f0}
.num{font-size:11px;color:#94a3b8;min-width:18px}
.txt{flex:1;font-size:12px}
.badge{display:inline-block;padding:1px 7px;border-radius:99px;font-size:10px;font-weight:700}
.bc{background:#dcfce7;color:#15803d}.bnc{background:#fee2e2;color:#991b1b}.bna{background:#f1f5f9;color:#64748b}
.ab{background:#ffedd5;color:#9a3412;display:inline-block;padding:1px 5px;border-radius:99px;font-size:10px;font-weight:700;margin-right:3px}
.obs{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-top:12px}
.foot{margin-top:28px;display:grid;grid-template-columns:1fr 1fr;gap:24px;border-top:1px solid #e2e8f0;padding-top:16px}
.firma{border-top:2px solid #1e293b;padding-top:4px;font-size:11px;color:#64748b;text-align:center;margin-top:28px}
foto{max-width:240px;max-height:160px;border-radius:8px;border:1px solid #e2e8f0;display:block;margin:0 auto 12px}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="hdr">
  <div>
    <p style="font-size:10px;opacity:.65;letter-spacing:.1em;text-transform:uppercase;margin-bottom:3px">GEPPI · SST</p>
    <h1>${tipoMeta.emoji || ''} Inspección de ${tipoMeta.label || inspeccion.tipo}</h1>
    <p>${inspeccion.empresa?.razon_social || '—'} &nbsp;·&nbsp; ${fechaFmt}</p>
  </div>
  <div class="ring-box"><div class="ring-pct">${pct}%</div><div class="ring-lbl">${labelPct}</div></div>
</div>
<div class="body">
  <div class="meta">
    <div class="m"><label>Inspector</label><span>${inspeccion.inspector||'—'}</span></div>
    <div class="m"><label>Fecha</label><span>${fechaFmt}</span></div>
    <div class="m"><label>Empresa</label><span>${inspeccion.empresa?.razon_social||'—'}</span></div>
    <div class="m"><label>Ciudad</label><span>${inspeccion.empresa?.ciudad||'—'}</span></div>
  </div>
  <div class="stats">
    <div class="stat"><b style="color:#15803d">${cumplen.length}</b><small>Cumplen</small></div>
    <div class="stat"><b style="color:#dc2626">${noCumplen.length}</b><small>No cumplen</small></div>
    <div class="stat"><b style="color:#64748b">${noAplica.length}</b><small>No aplica</small></div>
  </div>
  ${inspeccion.fotoBase64 ? `<img class="foto" src="${inspeccion.fotoBase64}" alt="Evidencia" />` : ''}
  <h2>Resultado por ítems</h2>
  ${items.map((item,i)=>`
  <div class="row ${item.resultado==='CUMPLE'?'cumple':item.resultado==='NO_CUMPLE'?'nc':'na'}">
    <span class="num">${i+1}.</span>
    <div class="txt">${item.label}
      ${item.resultado==='NO_CUMPLE'&&(item.accionTipo||item.accionDescripcion)?`
      <div style="margin-top:2px">
        ${item.accionTipo?`<span class="ab">${item.accionTipo}</span>`:''}
        ${item.accionDescripcion?`<span style="font-size:11px;color:#64748b;font-style:italic">${item.accionDescripcion}</span>`:''}
      </div>`:''}</div>
    <span class="badge ${item.resultado==='CUMPLE'?'bc':item.resultado==='NO_CUMPLE'?'bnc':'bna'}">${item.resultado==='CUMPLE'?'Cumple':item.resultado==='NO_CUMPLE'?'No cumple':'No aplica'}</span>
  </div>`).join('')}
  ${inspeccion.observacionGeneral?`<div class="obs"><strong>Observación general:</strong><br><span style="color:#475569">${inspeccion.observacionGeneral}</span></div>`:''}
  <div class="foot">
    <div><p style="font-size:11px;color:#94a3b8">GEPPI v2.0 · ${new Date().toLocaleString('es-CO')}</p></div>
    <div style="text-align:right"><div class="firma">Firma del Inspector</div></div>
  </div>
</div></body></html>`)
    w.document.close(); w.focus()
    setTimeout(() => { w.print(); w.close() }, 450)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 sm:items-center overflow-y-auto"
      style={{ background: 'rgba(15,30,60,0.60)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onVolver() }}>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 32px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Hero */}
        <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg,${color},${color}aa)` }}>
          <div className="absolute -right-4 -top-4 w-28 h-28 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle,#fff,transparent)' }} />
          {/* Nav */}
          <div className="flex items-center gap-3 px-5 pt-4 pb-2 relative">
            <button onClick={onVolver}
              className="p-1.5 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-colors">
              <X size={16} />
            </button>
            <div className="flex-1">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-widest">Informe de Inspección</p>
            </div>
            <button onClick={isExtintoresNew ? handlePrintExtintores : handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-colors border border-white/20">
              <Printer size={12} /> Imprimir
            </button>
          </div>
          {/* Content */}
          <div className="px-5 pt-2 pb-4 flex items-end gap-4 relative">
            <div className="flex-1 min-w-0">
              <p className="text-2xl mb-1">{tipoMeta.emoji}</p>
              <h2 className="text-lg font-black text-white">{tipoMeta.label || inspeccion.tipo}</h2>
              <p className="text-sm text-white/70 truncate">{inspeccion.empresa?.razon_social || '—'}</p>
              <p className="text-xs text-white/50">
                {isExtintoresNew ? mesFmt : fechaFmt} · {inspeccion.inspector}
                {isExtintoresNew && inspeccion.sede ? ` · ${inspeccion.sede}` : ''}
              </p>
            </div>
            <RingPct pct={pct} size={96} />
          </div>
          {/* Stats bar */}
          <div className="flex border-t border-white/15">
            {(isExtintoresNew
              ? [
                  { v: items.length,  l: 'Extintores', c: 'text-white/80' },
                  { v: extStats.c,    l: 'Cumplen',    c: 'text-emerald-200' },
                  { v: extStats.nc,   l: 'No cumplen', c: extStats.nc > 0 ? 'text-red-200' : 'text-white/50' },
                ]
              : [
                  { v: cumplen.length,   l: 'Cumplen',    c: 'text-emerald-200' },
                  { v: noCumplen.length, l: 'No cumplen', c: 'text-red-200'     },
                  { v: noAplica.length,  l: 'No aplica',  c: 'text-white/50'    },
                ]
            ).map((s, i) => (
              <div key={i} className={`flex-1 py-2.5 text-center ${i > 0 ? 'border-l border-white/15' : ''}`}>
                <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
                <p className="text-xs text-white/45">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Cuerpo scrollable */}
        <div className="overflow-y-auto p-5 space-y-4" style={{ maxHeight: 'calc(100vh - 320px)' }}>

          {/* Alerta no conformidades — regular format */}
          {!isExtintoresNew && noCumplen.length > 0 && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 rounded-xl border border-red-100">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700">{noCumplen.length} ítem{noCumplen.length > 1 ? 's' : ''} requieren acción</p>
                <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{noCumplen.map(i => i.label).join(' · ')}</p>
              </div>
            </div>
          )}

          {/* Foto — only for regular format */}
          {!isExtintoresNew && inspeccion.fotoBase64 && (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <img src={inspeccion.fotoBase64} alt="Evidencia" className="w-full max-h-52 object-cover" />
              <div className="px-3 py-2 bg-slate-50 flex items-center gap-2 border-t border-slate-100">
                <Shield size={12} className="text-slate-400" />
                <span className="text-xs text-slate-500">Foto de evidencia de la inspección</span>
              </div>
            </div>
          )}

          {/* Regular items */}
          {!isExtintoresNew && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Resultado por ítems</p>
              {items.map(item => <FilaItem key={item.id} item={item} />)}
            </div>
          )}

          {/* Extintores — table view */}
          {isExtintoresNew && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                Resultado por extintor — {mesFmt}
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs border-collapse" style={{ minWidth: 640 }}>
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="text-left px-3 py-2 font-bold">#</th>
                      <th className="text-left px-3 py-2 font-bold">Tipo</th>
                      <th className="text-left px-3 py-2 font-bold">Ubicación</th>
                      {ITEM_IDS.map(id => (
                        <th key={id} className="px-1.5 py-2 font-bold text-center w-8">{id}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((ext, ri) => (
                      <tr key={ext.extintorId} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-3 py-2 font-bold text-slate-700">{ext.numero}</td>
                        <td className="px-3 py-2 text-slate-600">{ext.tipo || '—'}</td>
                        <td className="px-3 py-2 text-slate-500 max-w-[120px] truncate">{ext.ubicacion || '—'}</td>
                        {ITEM_IDS.map(id => {
                          const v = ext.resultados?.[id]?.resultado
                          const bg = v === 'CUMPLE' ? 'bg-emerald-100 text-emerald-700' : v === 'NO_CUMPLE' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                          return (
                            <td key={id} className="px-1 py-2 text-center">
                              <span className={`inline-block px-1 py-0.5 rounded text-[10px] font-bold ${bg}`}>
                                {v === 'CUMPLE' ? 'C' : v === 'NO_CUMPLE' ? 'NC' : 'NA'}
                              </span>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Observations for NC items */}
              {(() => {
                const obs = []
                items.forEach(ext => {
                  ITEM_IDS.forEach(id => {
                    const r = ext.resultados?.[id]
                    if (r?.resultado === 'NO_CUMPLE' && r.observacion)
                      obs.push({ ext: ext.numero, id, text: r.observacion })
                  })
                })
                return obs.length > 0 ? (
                  <div className="mt-3 bg-orange-50 rounded-xl border border-orange-100 p-3">
                    <p className="text-xs font-bold text-orange-700 uppercase tracking-widest mb-2">Observaciones</p>
                    {obs.map((o, i) => (
                      <p key={i} className="text-xs text-orange-800 mb-1">
                        <span className="font-bold">Ext.#{o.ext} ítem {o.id}:</span> {o.text}
                      </p>
                    ))}
                  </div>
                ) : null
              })()}
            </div>
          )}

          {/* Observación general — regular format only */}
          {!isExtintoresNew && inspeccion.observacionGeneral && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Observación general</p>
              <p className="text-sm text-slate-600 leading-relaxed">{inspeccion.observacionGeneral}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
