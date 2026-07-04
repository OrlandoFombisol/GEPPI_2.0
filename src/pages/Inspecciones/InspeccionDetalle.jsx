import { useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, Printer, CheckCircle2, XCircle, MinusCircle, AlertTriangle, Shield } from 'lucide-react'
import { calcularCumplimiento, TIPOS_INSPECCION } from './items'

// ── Ring SVG ejecutivo ─────────────────────────────────────────────────────────
function RingEjecutivo({ pct, size = 120 }) {
  const stroke = 10
  const r      = (size - stroke * 2) / 2
  const circ   = 2 * Math.PI * r
  const offset = circ * (1 - pct / 100)
  const color  = pct >= 85 ? '#16A34A' : pct >= 60 ? '#D97706' : '#DC2626'
  const label  = pct >= 85 ? 'APROBADO' : pct >= 60 ? 'PARCIAL' : 'CRÍTICO'
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={stroke} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke="white" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          style={{ fontSize: 28, fontWeight: 900, color: 'white', lineHeight: 1 }}
        >
          {pct}%
        </motion.span>
        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.12em', marginTop: 2 }}>
          {label}
        </span>
      </div>
    </div>
  )
}

// ── Ítem de inspección ────────────────────────────────────────────────────────
function FilaItem({ item, index }) {
  const cfg = {
    CUMPLE:    { Icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', label: 'Cumple'    },
    NO_CUMPLE: { Icon: XCircle,      bg: 'bg-red-50',     border: 'border-red-100',     text: 'text-red-700',     badge: 'bg-red-100     text-red-700',     label: 'No cumple' },
    NO_APLICA: { Icon: MinusCircle,  bg: 'bg-slate-50',   border: 'border-slate-100',   text: 'text-slate-400',   badge: 'bg-slate-100   text-slate-500',   label: 'No aplica' },
  }
  const c = cfg[item.resultado] || cfg.NO_APLICA
  const { Icon } = c
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.3 }}
      className={`flex items-start gap-3 p-3 rounded-xl border ${c.bg} ${c.border} mb-2`}
    >
      <Icon size={17} className={`mt-0.5 flex-shrink-0 ${c.text}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 font-medium leading-snug">{item.label}</p>
        {item.resultado === 'NO_CUMPLE' && (
          <div className="mt-1.5 flex flex-wrap gap-1.5 items-center">
            {item.accionTipo && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                {item.accionTipo}
              </span>
            )}
            {item.accionDescripcion && (
              <span className="text-xs text-slate-500 italic">{item.accionDescripcion}</span>
            )}
          </div>
        )}
      </div>
      <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
        {c.label}
      </span>
    </motion.div>
  )
}

// ── Detalle / Informe ─────────────────────────────────────────────────────────
export default function InspeccionDetalle({ inspeccion, onVolver }) {
  const printRef = useRef(null)
  if (!inspeccion) return null

  const tipoMeta  = TIPOS_INSPECCION.find(t => t.value === inspeccion.tipo) || {}
  const items     = inspeccion.items || []
  const pct       = calcularCumplimiento(items)
  const noCumplen = items.filter(i => i.resultado === 'NO_CUMPLE')
  const cumplen   = items.filter(i => i.resultado === 'CUMPLE')
  const noAplica  = items.filter(i => i.resultado === 'NO_APLICA')
  const color     = tipoMeta.color || '#1b62cc'
  const fechaFmt  = inspeccion.fecha
    ? new Date(inspeccion.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=820,height=960')
    const colorPct = pct >= 85 ? '#16A34A' : pct >= 60 ? '#D97706' : '#DC2626'
    const labelPct = pct >= 85 ? 'APROBADO' : pct >= 60 ? 'PARCIAL' : 'CRÍTICO'
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Informe Inspección — ${tipoMeta.label || inspeccion.tipo}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1e293b;background:#fff}
.header{background:linear-gradient(135deg,${color},${color}cc);color:#fff;padding:28px 32px;display:flex;justify-content:space-between;align-items:center}
.header h1{font-size:22px;font-weight:900;margin-bottom:2px}
.header p{font-size:12px;opacity:0.8}
.ring-wrap{text-align:center;background:rgba(255,255,255,0.15);border-radius:16px;padding:16px 24px;border:1px solid rgba(255,255,255,0.2)}
.ring-pct{font-size:42px;font-weight:900;color:#fff;line-height:1}
.ring-lbl{font-size:10px;font-weight:700;letter-spacing:.14em;color:rgba(255,255,255,.7);margin-top:2px}
.body{padding:24px 32px}
.meta-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px 24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px 18px;margin-bottom:20px}
.meta-item label{font-size:10px;color:#94a3b8;display:block;margin-bottom:1px;text-transform:uppercase;letter-spacing:.06em}
.meta-item span{font-weight:700;font-size:13px}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px}
.stat{text-align:center;padding:12px 8px;border-radius:10px;border:1px solid #e2e8f0}
.stat-val{font-size:22px;font-weight:900}
.stat-lbl{font-size:10px;color:#94a3b8;margin-top:1px}
h2{font-size:12px;font-weight:700;color:#64748b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #f1f5f9}
.item-row{display:flex;align-items:flex-start;gap:10px;padding:8px 10px;border-radius:8px;margin-bottom:4px;border:1px solid transparent}
.item-row.cumple{background:#f0fdf4;border-color:#bbf7d0}
.item-row.no-cumple{background:#fef2f2;border-color:#fecaca}
.item-row.no-aplica{background:#f8fafc;border-color:#e2e8f0}
.item-num{font-size:11px;color:#94a3b8;min-width:20px}
.item-txt{flex:1;font-size:12px}
.badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700}
.badge-cumple{background:#dcfce7;color:#15803d}
.badge-no-cumple{background:#fee2e2;color:#991b1b}
.badge-no-aplica{background:#f1f5f9;color:#64748b}
.accion-badge{background:#ffedd5;color:#9a3412;display:inline-block;padding:1px 6px;border-radius:99px;font-size:10px;font-weight:700;margin-right:4px}
.obs{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-top:16px}
.footer{margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:24px;border-top:1px solid #e2e8f0;padding-top:20px}
.firma-box{border-top:2px solid #1e293b;padding-top:6px;font-size:11px;color:#64748b;text-align:center;margin-top:32px}
.foto{max-width:260px;max-height:180px;border-radius:10px;border:1px solid #e2e8f0;display:block;margin:0 auto 16px}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="header">
  <div>
    <p style="font-size:11px;opacity:.7;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">GEPPI · Seguridad y Salud en el Trabajo</p>
    <h1>${tipoMeta.emoji || ''} Inspección de ${tipoMeta.label || inspeccion.tipo}</h1>
    <p>${inspeccion.empresa?.razon_social || '—'} &nbsp;·&nbsp; ${fechaFmt}</p>
  </div>
  <div class="ring-wrap">
    <div class="ring-pct">${pct}%</div>
    <div class="ring-lbl">${labelPct}</div>
  </div>
</div>
<div class="body">
  <div class="meta-grid">
    <div class="meta-item"><label>Inspector</label><span>${inspeccion.inspector || '—'}</span></div>
    <div class="meta-item"><label>Fecha</label><span>${fechaFmt}</span></div>
    <div class="meta-item"><label>Empresa</label><span>${inspeccion.empresa?.razon_social || '—'}</span></div>
    <div class="meta-item"><label>Ciudad</label><span>${inspeccion.empresa?.ciudad || '—'}</span></div>
  </div>
  <div class="stats">
    <div class="stat"><div class="stat-val" style="color:#15803d">${cumplen.length}</div><div class="stat-lbl">Cumplen</div></div>
    <div class="stat"><div class="stat-val" style="color:#dc2626">${noCumplen.length}</div><div class="stat-lbl">No cumplen</div></div>
    <div class="stat"><div class="stat-val" style="color:#64748b">${noAplica.length}</div><div class="stat-lbl">No aplica</div></div>
  </div>
  ${inspeccion.fotoBase64 ? `<img class="foto" src="${inspeccion.fotoBase64}" alt="Evidencia fotográfica" />` : ''}
  <h2>Resultado por ítems</h2>
  ${items.map((item, i) => `
  <div class="item-row ${item.resultado==='CUMPLE'?'cumple':item.resultado==='NO_CUMPLE'?'no-cumple':'no-aplica'}">
    <span class="item-num">${i+1}.</span>
    <div class="item-txt">
      ${item.label}
      ${item.resultado==='NO_CUMPLE' && (item.accionTipo||item.accionDescripcion) ? `
      <div style="margin-top:3px">
        ${item.accionTipo?`<span class="accion-badge">${item.accionTipo}</span>`:''}
        ${item.accionDescripcion?`<span style="font-size:11px;color:#64748b;font-style:italic">${item.accionDescripcion}</span>`:''}
      </div>` : ''}
    </div>
    <span class="badge badge-${item.resultado==='CUMPLE'?'cumple':item.resultado==='NO_CUMPLE'?'no-cumple':'no-aplica'}">${item.resultado==='CUMPLE'?'Cumple':item.resultado==='NO_CUMPLE'?'No cumple':'No aplica'}</span>
  </div>`).join('')}
  ${inspeccion.observacionGeneral ? `<div class="obs"><strong>Observación general:</strong><br><span style="color:#475569">${inspeccion.observacionGeneral}</span></div>` : ''}
  <div class="footer">
    <div>
      <p style="font-size:11px;color:#94a3b8;margin-bottom:4px">Generado por GEPPI v2.0</p>
      <p style="font-size:10px;color:#cbd5e1">${new Date().toLocaleString('es-CO')}</p>
    </div>
    <div style="text-align:right">
      <div class="firma-box">Firma del Inspector</div>
    </div>
  </div>
</div></body></html>`)
    w.document.close()
    w.focus()
    setTimeout(() => { w.print(); w.close() }, 500)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
        ref={printRef}
      >
        {/* Deco circles */}
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />
        <div className="absolute right-20 bottom-0 w-20 h-20 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />

        {/* Nav bar */}
        <div className="relative flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={onVolver}
            className="p-1.5 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white/70 uppercase tracking-widest">Informe de Inspección</p>
          </div>
          <button onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-colors border border-white/20">
            <Printer size={13} /> Imprimir
          </button>
        </div>

        {/* Hero content */}
        <div className="relative px-5 pt-2 pb-6 flex items-end gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-3xl mb-1">{tipoMeta.emoji}</p>
            <h1 className="text-xl font-black text-white leading-tight">
              {tipoMeta.label || inspeccion.tipo}
            </h1>
            <p className="text-sm text-white/70 mt-0.5 truncate">
              {inspeccion.empresa?.razon_social || '—'}
            </p>
            <p className="text-xs text-white/50 mt-0.5">{fechaFmt} · {inspeccion.inspector}</p>
          </div>
          <RingEjecutivo pct={pct} size={100} />
        </div>

        {/* Stats bar */}
        <div className="flex border-t border-white/15">
          {[
            { v: cumplen.length,   l: 'Cumplen',    c: 'text-emerald-200' },
            { v: noCumplen.length, l: 'No cumplen', c: 'text-red-200'     },
            { v: noAplica.length,  l: 'No aplica',  c: 'text-white/50'    },
          ].map((s, i) => (
            <div key={i} className={`flex-1 py-3 text-center ${i > 0 ? 'border-l border-white/15' : ''}`}>
              <p className={`text-xl font-black ${s.c}`}>{s.v}</p>
              <p className="text-xs text-white/50">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-4">

          {/* Alerta de no conformidades */}
          {noCumplen.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100"
            >
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-700">
                  {noCumplen.length} ítem{noCumplen.length > 1 ? 's' : ''} requieren acción
                </p>
                <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
                  {noCumplen.map(i => i.label).join(' · ')}
                </p>
              </div>
            </motion.div>
          )}

          {/* Foto */}
          {inspeccion.fotoBase64 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm"
            >
              <img src={inspeccion.fotoBase64} alt="Evidencia fotográfica"
                className="w-full max-h-64 object-cover" />
              <div className="px-4 py-2.5 bg-white flex items-center gap-2">
                <Shield size={13} className="text-slate-400" />
                <span className="text-xs text-slate-500">Foto de evidencia de la inspección</span>
              </div>
            </motion.div>
          )}

          {/* Ítems */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Resultado por ítems
            </p>
            {items.map((item, i) => <FilaItem key={item.id} item={item} index={i} />)}
          </div>

          {/* Observación */}
          {inspeccion.observacionGeneral && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
            >
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Observación general</p>
              <p className="text-sm text-slate-600 leading-relaxed">{inspeccion.observacionGeneral}</p>
            </motion.div>
          )}

          <div className="pb-8" />
        </div>
      </div>
    </div>
  )
}
