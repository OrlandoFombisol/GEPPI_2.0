import { useState, useEffect, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Sparkles, Plus, Trash2, Printer, GitCommit, Calendar,
  Code2, FileCode2, FlaskConical, LayoutPanelTop, Boxes, Database, NotebookPen,
} from 'lucide-react'
import { notaMejoraDB, auditoriaDB } from '@/db'
import { useUser } from '@/contexts/UserContext'
import { MODULO, ACCION } from '@/constants'
import { Button, StatsCard, Badge, Card, AlertBanner } from '@/components/ui'
import { agruparPorDia, formatearFechaLargaEs, fechaEnBogota } from '@/utils/mejoraContinua'
import mejoraData from '@/data/mejora-continua.json'
import NotaModal from './NotaModal'

// ─── Barra de "Mejoras por área" ──────────────────────────────────────────────
function BarraArea({ area, cantidad, max }) {
  const pct = max > 0 ? Math.round((cantidad / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-600 w-52 flex-shrink-0 truncate" title={area}>{area}</span>
      <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-primary-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-700 w-6 text-right flex-shrink-0">{cantidad}</span>
    </div>
  )
}

// ─── Bloque de un día ──────────────────────────────────────────────────────────
function BloqueDia({ dia, onEliminarNota, puedeEliminar }) {
  return (
    <div className="dia-mejora bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h3 className="text-sm font-bold text-slate-800 capitalize">{dia.fechaLarga}</h3>
        <span className="text-xs text-slate-400">
          {dia.mejoras.length} mejora{dia.mejoras.length !== 1 ? 's' : ''}
          {dia.totalLineas > 0 && ` · ${dia.totalLineas} líneas`}
        </span>
      </div>

      <div className="space-y-2">
        {dia.mejoras.map(m => (
          <div key={m.hash} className="flex items-start gap-2.5">
            <GitCommit size={14} className="text-slate-300 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-700 flex-1">{m.titulo}</p>
            <Badge variant="info" size="sm" className="flex-shrink-0">{m.area}</Badge>
          </div>
        ))}

        {dia.notas.map(n => (
          <div key={`nota-${n.id}`} className="flex items-start gap-2.5 bg-violet-50/60 rounded-lg px-2.5 py-2">
            <NotebookPen size={14} className="text-violet-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700">{n.titulo}</p>
              {n.detalle && <p className="text-xs text-slate-500 mt-0.5">{n.detalle}</p>}
            </div>
            <Badge variant="neutral" size="sm" className="flex-shrink-0">{n.tipoLabel}</Badge>
            {puedeEliminar && (
              <button
                onClick={() => onEliminarNota(n.id)}
                className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                title="Quitar nota"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Construcción del documento de impresión ─────────────────────────────────
function construirHtmlImpresion(dias, generadoEnTexto) {
  const filasDias = dias.map(dia => `
    <div class="dia">
      <h2>${dia.fechaLarga}</h2>
      ${dia.mejoras.map(m => `<div class="item"><span class="area">${m.area}</span>${m.titulo}</div>`).join('')}
      ${dia.notas.map(n => `<div class="item nota"><span class="area">${n.tipoLabel}</span>${n.titulo}${n.detalle ? ` — ${n.detalle}` : ''}</div>`).join('')}
    </div>
  `).join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Mejora Continua — GEPPI</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1e293b;padding:28px}
.hdr{border-bottom:2px solid #1b62cc;padding-bottom:12px;margin-bottom:18px}
.hdr h1{font-size:19px;font-weight:900;color:#083278}
.hdr p{font-size:11px;color:#64748b;margin-top:3px}
.dia{break-inside:avoid;page-break-inside:avoid;margin-bottom:16px}
.dia h2{font-size:12px;font-weight:700;text-transform:capitalize;background:#f1f5f9;padding:5px 8px;border-radius:6px;margin-bottom:6px}
.item{display:flex;gap:8px;padding:3px 8px;font-size:11.5px}
.item.nota{background:#f5f3ff}
.area{font-size:9px;font-weight:700;color:#475569;background:#e2e8f0;border-radius:99px;padding:1px 7px;flex-shrink:0;white-space:nowrap}
.foot{margin-top:24px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8}
@media print{@page{margin:14mm}}
</style></head><body>
<div class="hdr">
  <h1>Mejora Continua — GEPPI</h1>
  <p>Historial de mejoras y trabajo realizado sobre la plataforma</p>
</div>
${filasDias}
<div class="foot">Cifras al ${generadoEnTexto}</div>
</body></html>`
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Page() {
  const { user, isAdmin, loading: loadingUser } = useUser()
  const [notas,    setNotas]    = useState([])
  const [cargando, setCargando] = useState(true)
  const [modal,    setModal]    = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [delId,    setDelId]    = useState(null)

  useEffect(() => {
    if (!isAdmin) return
    cargar()
  }, [isAdmin])

  async function cargar() {
    setCargando(true)
    try {
      const data = await notaMejoraDB.getAll()
      setNotas(data || [])
    } finally {
      setCargando(false)
    }
  }

  const dias = useMemo(() => agruparPorDia(mejoraData.commits, notas), [notas])

  const areaCounts = useMemo(() => {
    const counts = {}
    for (const dia of dias) {
      for (const m of dia.mejoras) counts[m.area] = (counts[m.area] || 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [dias])

  const maxArea = areaCounts[0]?.[1] || 0

  const lineasEscritas = useMemo(
    () => mejoraData.commits.reduce((s, c) => s + (c.agregadas || 0) + (c.quitadas || 0), 0),
    []
  )

  const generadoEnTexto = useMemo(() => {
    const dia = fechaEnBogota(mejoraData.generadoEn)
    return dia ? formatearFechaLargaEs(dia) : '—'
  }, [])

  const guardarNota = async (datos) => {
    setSaving(true)
    try {
      const id = await notaMejoraDB.create(datos)
      await auditoriaDB.registrar(MODULO.MEJORA_CONTINUA, ACCION.CREAR, datos.titulo, id, user?.id)
      setModal(false)
      await cargar()
    } catch (err) {
      alert(`Error al guardar la nota: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const eliminarNota = async () => {
    if (delId === null) return
    const nota = notas.find(n => n.id === delId)
    await notaMejoraDB.remove(delId)
    await auditoriaDB.registrar(MODULO.MEJORA_CONTINUA, ACCION.ELIMINAR, nota?.titulo || '', delId, user?.id)
    setDelId(null)
    await cargar()
  }

  const imprimir = () => {
    const w = window.open('', '_blank', 'width=1000,height=900')
    w.document.write(construirHtmlImpresion(dias, generadoEnTexto))
    w.document.close(); w.focus()
    setTimeout(() => { w.print(); w.close() }, 450)
  }

  // ── Guarda de acceso ──────────────────────────────────────────────────────
  if (loadingUser) return null
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  const t = mejoraData.totales

  return (
    <div className="p-3 sm:p-6 space-y-5">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles size={22} className="text-violet-600" strokeWidth={1.8} />
            Mejora Continua
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Todo lo que se ha construido y mejorado en la plataforma, día por día.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" iconLeft={Printer} onClick={imprimir}>Imprimir</Button>
          <Button iconLeft={Plus} onClick={() => setModal(true)}>Agregar nota</Button>
        </div>
      </div>

      {/* Tarjetas de cifras */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatsCard icon={Calendar}       label="Días de trabajo"            value={t.diasTrabajo}        color="primary"  delay={0.00} />
        <StatsCard icon={GitCommit}      label="Mejoras publicadas"         value={t.numCambios}         color="success"  delay={0.03} />
        <StatsCard icon={Code2}          label="Líneas de código propias"   value={t.lineasCodigoPropio} color="info"     delay={0.06} />
        <StatsCard icon={FileCode2}      label="Líneas escritas/reescritas" value={lineasEscritas}       color="orange"   delay={0.09} />
        <StatsCard icon={FlaskConical}   label="Pruebas automáticas"        value={t.pruebasAutomaticas} color="green"    delay={0.12} />
        <StatsCard icon={LayoutPanelTop} label="Pantallas"                  value={t.pantallas}          color="yellow"   delay={0.15} />
        <StatsCard icon={Boxes}          label="Módulos de reglas de negocio" value={t.modulosNegocio}   color="primary"  delay={0.18} />
        <StatsCard icon={Database}       label="Cambios a la base de datos" value={t.migracionesBD}      color="red"      delay={0.21} />
        <StatsCard icon={NotebookPen}    label="Trabajo fuera del código"   value={notas.length}         color="neutral"  delay={0.24} />
      </div>

      {/* Mejoras por área */}
      {areaCounts.length > 0 && (
        <Card title="Mejoras por área">
          <div className="space-y-2.5">
            {areaCounts.map(([area, cantidad]) => (
              <BarraArea key={area} area={area} cantidad={cantidad} max={maxArea} />
            ))}
          </div>
        </Card>
      )}

      {cargando ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : dias.length === 0 ? (
        <AlertBanner level="info" message="Todavía no hay mejoras ni notas registradas." />
      ) : (
        <div className="space-y-3">
          {dias.map(dia => (
            <BloqueDia
              key={dia.fecha}
              dia={dia}
              onEliminarNota={setDelId}
              puedeEliminar
            />
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 text-center pt-2">
        Cifras al {generadoEnTexto}
      </p>

      {/* Modal nueva nota */}
      {modal && (
        <NotaModal
          onSave={guardarNota}
          onClose={() => setModal(false)}
          saving={saving}
        />
      )}

      {/* Confirmar eliminar nota */}
      {delId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-bold text-slate-900 mb-2">¿Quitar esta nota?</h3>
            <p className="text-sm text-slate-500 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDelId(null)}
                className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                Cancelar
              </button>
              <button onClick={eliminarNota}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                Quitar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
