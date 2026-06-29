import { useState, useEffect } from 'react'
import {
  FileSpreadsheet, ClipboardList, Shield, Package,
  Users, CheckCircle2, AlertTriangle, Download,
} from 'lucide-react'
import { sedeDB }   from '@/db'
import { SISTEMA }  from '@/constants'
import {
  generarReporteEntregas,
  generarReporteEstadoEPP,
  generarReporteInventario,
  generarReporteCumplimiento,
} from '@/services/reportExporter'
import { Card, Button, AlertBanner } from '@/components/ui'

// ─── Tarjeta de reporte ───────────────────────────────────────────────────────

function TarjetaReporte({
  icon: Icon, iconColor, title, description, badge,
  onGenerar, generando, filas, error,
}) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        {/* Ícono */}
        <div className={['w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', iconColor].join(' ')}>
          <Icon size={20} className="text-white" strokeWidth={1.8} />
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            {badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
          {filas !== null && filas !== undefined && (
            <p className="text-[11px] text-green-700 font-medium mt-1.5 flex items-center gap-1">
              <CheckCircle2 size={11} /> {typeof filas === 'object'
                ? `${filas.total} trabajadores · ${filas.pct}% cumple`
                : `${filas} fila${filas !== 1 ? 's' : ''} exportada${filas !== 1 ? 's' : ''}`
              }
            </p>
          )}
        </div>
      </div>

      {error && <AlertBanner level="danger" message={error} closable />}

      <Button
        variant="outline"
        iconLeft={Download}
        onClick={onGenerar}
        loading={generando}
        className="self-start"
      >
        {generando ? 'Generando…' : 'Generar Excel'}
      </Button>
    </Card>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Page() {
  const [sedes,     setSedes]     = useState([])
  const [filtroSede, setFiltroSede] = useState('TODOS')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')

  // Estado por reporte: { generando, filas, error }
  const [r1, setR1] = useState({})
  const [r2, setR2] = useState({})
  const [r3, setR3] = useState({})
  const [r4, setR4] = useState({})

  useEffect(() => {
    sedeDB.getAll().then(s => setSedes(s || []))
  }, [])

  const filtros = {
    sedeId: filtroSede !== 'TODOS' ? filtroSede : undefined,
    desde:  filtroDesde || undefined,
    hasta:  filtroHasta || undefined,
  }

  // ── Ejecutar reporte ───────────────────────────────────────────────────────
  const ejecutar = (setEstado, fn) => async () => {
    setEstado({ generando: true, filas: null, error: null })
    try {
      const resultado = await fn(filtros)
      setEstado({ generando: false, filas: resultado, error: null })
    } catch (err) {
      console.error('[GEPPI Reportes]', err)
      setEstado({ generando: false, filas: null, error: err.message || 'Error al generar el reporte.' })
    }
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Exportaciones para auditorías SST · {SISTEMA.NORMATIVA}
        </p>
      </div>

      {/* Filtros globales */}
      <Card title="Filtros de exportación" subtitle="Aplican a todos los reportes">
        <div className="flex flex-wrap items-end gap-4">

          {/* Sede */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Sede</label>
            <select
              value={filtroSede}
              onChange={e => setFiltroSede(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-300 text-sm bg-white text-slate-700
                         focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[180px]"
            >
              <option value="TODOS">Todas las sedes</option>
              {sedes.map(s => (
                <option key={s.id} value={String(s.id)}>{s.nombre}</option>
              ))}
            </select>
          </div>

          {/* Desde (solo aplica al reporte de entregas) */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Fecha desde <span className="text-slate-400">(entregas)</span>
            </label>
            <input
              type="date"
              value={filtroDesde}
              onChange={e => setFiltroDesde(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-300 text-sm bg-white text-slate-700
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Hasta */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Fecha hasta <span className="text-slate-400">(entregas)</span>
            </label>
            <input
              type="date"
              value={filtroHasta}
              onChange={e => setFiltroHasta(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-300 text-sm bg-white text-slate-700
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Limpiar */}
          {(filtroSede !== 'TODOS' || filtroDesde || filtroHasta) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFiltroSede('TODOS'); setFiltroDesde(''); setFiltroHasta('') }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      </Card>

      {/* Aviso legal */}
      <AlertBanner
        level="info"
        message={`Los archivos Excel generados sirven como evidencia documental del cumplimiento del ${SISTEMA.NORMATIVA} para inspecciones del Ministerio de Trabajo y auditorías del COPASST.`}
      />

      {/* Tarjetas de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <TarjetaReporte
          icon={ClipboardList}
          iconColor="bg-primary-800"
          title="Historial de entregas"
          description="Una fila por cada EPP entregado: acta, fecha, trabajador, cargo, sede, nombre del EPP, cantidad y fecha de vencimiento."
          badge="Decreto 1072/2015 Art. 2.2.4.6.24"
          onGenerar={ejecutar(setR1, generarReporteEntregas)}
          generando={!!r1.generando}
          filas={r1.filas}
          error={r1.error}
        />

        <TarjetaReporte
          icon={Users}
          iconColor="bg-teal-700"
          title="Estado EPP por trabajador"
          description="Semáforo por trabajador y EPP: fecha de vencimiento de cada elemento, estado actual (vigente / próximo a vencer / vencido / sin entrega)."
          badge="Para COPASST"
          onGenerar={ejecutar(setR2, generarReporteEstadoEPP)}
          generando={!!r2.generando}
          filas={r2.filas}
          error={r2.error}
        />

        <TarjetaReporte
          icon={Package}
          iconColor="bg-orange-600"
          title="Inventario de EPP"
          description="Stock actual por EPP y sede: stock mínimo, estado (OK / Bajo / Agotado) y fecha de última actualización."
          badge="Kardex"
          onGenerar={ejecutar(setR3, generarReporteInventario)}
          generando={!!r3.generando}
          filas={r3.filas}
          error={r3.error}
        />

        <TarjetaReporte
          icon={Shield}
          iconColor="bg-green-700"
          title="Cumplimiento SST"
          description="Resumen ejecutivo + detalle: % de trabajadores con todos sus EPP vigentes, lista de incumplimientos, trabajadores sin primera entrega."
          badge="Res. 0312/2019"
          onGenerar={ejecutar(setR4, generarReporteCumplimiento)}
          generando={!!r4.generando}
          filas={r4.filas}
          error={r4.error}
        />

      </div>

      {/* Nota */}
      <p className="text-xs text-slate-400 text-center">
        Los reportes se generan y descargan localmente. Ningún dato abandona el equipo.
        Formato: <strong>.xlsx</strong> compatible con Microsoft Excel, LibreOffice y Google Sheets.
      </p>

    </div>
  )
}
