import { useState, useRef, useCallback } from 'react'
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle,
  RefreshCw, Info, Loader2, ChevronRight, Table2, Users, Link2, History,
  Download,
} from 'lucide-react'
import * as XLSX               from 'xlsx'
import { parseCompleto }       from '@/services/excelImporter'
import { guardarImportacion }  from '@/services/importSaver'
import { Button, AlertBanner } from '@/components/ui'

// ─── Descarga formato de ejemplo ──────────────────────────────────────────────

function descargarFormatoMatriz() {
  const wb = XLSX.utils.book_new()

  // Hoja 1: Matriz EPP
  const eppHeaders = ['Item', 'Elemento de Protección Personal', 'Categoría / Parte cuerpo', 'Norma técnica', 'Marca sugerida', 'Vida útil', 'Descripción / Especificaciones']
  const eppRows = [
    [1, 'Casco de seguridad dieléctrico', 'Cabeza', 'NTC 1523 / ANSI Z89.1', 'MSA / 3M', '2 años', 'Casco clase E con ventilación y porta-linterna'],
    [2, 'Guantes de nitrilo calibre 15', 'Manos y extremidades superiores', 'EN 374 / NTC 2367', 'Showa / Ansell', '3 meses', 'Resistente a hidrocarburos y productos químicos'],
    [3, 'Botas de seguridad con punta de acero', 'Pies y extremidades inferiores', 'NTC 2396 / ASTM F2412', 'Omega / Bata', '1 año', 'Suela antideslizante, antistática, EH'],
  ]
  const wsEPP = XLSX.utils.aoa_to_sheet([eppHeaders, ...eppRows])
  wsEPP['!cols'] = [{ wch: 6 }, { wch: 38 }, { wch: 26 }, { wch: 24 }, { wch: 18 }, { wch: 12 }, { wch: 42 }]
  XLSX.utils.book_append_sheet(wb, wsEPP, 'Matriz EPP')

  // Hoja 2: Cargos
  const cargosHeaders = ['Cargo', 'Item EPP 1', 'Item EPP 2', 'Item EPP 3']
  const cargosRows = [
    ['Conductor', 1, 2, 3],
    ['Operario de bodega', 1, 3, ''],
    ['Almacenista', 2, '', ''],
  ]
  const wsCargos = XLSX.utils.aoa_to_sheet([cargosHeaders, ...cargosRows])
  wsCargos['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 12 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, wsCargos, 'Cargos')

  // Hoja 3: Gestión del Cambio
  const cambiosHeaders = ['Versión', 'Fecha', 'Descripción del cambio', 'Responsable']
  const cambiosRows = [
    ['007', '15/05/2026', 'Actualización de normas técnicas y vida útil', 'Lilian Ordóñez'],
    ['006', '10/01/2026', 'Inclusión de EPP para riesgo eléctrico', 'Área SST'],
  ]
  const wsCambios = XLSX.utils.aoa_to_sheet([cambiosHeaders, ...cambiosRows])
  wsCambios['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 44 }, { wch: 24 }]
  XLSX.utils.book_append_sheet(wb, wsCambios, 'Gestión del Cambio')

  XLSX.writeFile(wb, 'FORMATO_MT-SST-005_MATRIZ_EPP.xlsx')
}

// ─── Constantes de fase ───────────────────────────────────────────────────────

const FASE = {
  INICIAL:    'INICIAL',
  PROCESANDO: 'PROCESANDO',
  PREVIEW:    'PREVIEW',
  GUARDANDO:  'GUARDANDO',
  COMPLETADO: 'COMPLETADO',
  ERROR:      'ERROR',
}

// ─── Sub-componente: DropZone ─────────────────────────────────────────────────

function DropZone({ onArchivo, ocupado }) {
  const inputRef  = useRef(null)
  const [dragging, setDragging] = useState(false)

  const procesar = useCallback((file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls'].includes(ext)) {
      alert('Solo se aceptan archivos .xlsx o .xls')
      return
    }
    onArchivo(file)
  }, [onArchivo])

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    procesar(e.dataTransfer.files[0])
  }

  return (
    <div
      onDragEnter={(e) => { e.preventDefault(); setDragging(true) }}
      onDragOver={(e)  => { e.preventDefault(); setDragging(true) }}
      onDragLeave={(e) => { e.preventDefault(); setDragging(false) }}
      onDrop={onDrop}
      onClick={() => !ocupado && inputRef.current?.click()}
      className={[
        'relative flex flex-col items-center justify-center gap-4',
        'rounded-2xl border-2 border-dashed p-12 cursor-pointer',
        'transition-colors duration-150 select-none',
        dragging
          ? 'border-primary-500 bg-primary-50'
          : 'border-slate-300 bg-slate-50 hover:border-primary-400 hover:bg-primary-50/40',
        ocupado ? 'pointer-events-none opacity-60' : '',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => procesar(e.target.files[0])}
      />

      <div className={[
        'w-16 h-16 rounded-2xl flex items-center justify-center transition-colors',
        dragging ? 'bg-primary-100' : 'bg-white border border-slate-200',
      ].join(' ')}>
        <FileSpreadsheet size={32} className={dragging ? 'text-primary-700' : 'text-slate-400'} strokeWidth={1.5} />
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">
          Arrastra el archivo aquí o{' '}
          <span className="text-primary-700 underline underline-offset-2">selecciónalo</span>
        </p>
        <p className="text-xs text-slate-400 mt-1">
          MT-SST-005. VERSION 007. MATRIZ DE EPP 2026 — .xlsx / .xls
        </p>
      </div>

      <div className="flex items-center gap-6 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Table2  size={13} className="text-green-500" /> Hoja EPP
        </span>
        <span className="flex items-center gap-1.5">
          <Users   size={13} className="text-blue-500"  /> Hoja Cargos
        </span>
        <span className="flex items-center gap-1.5">
          <History size={13} className="text-purple-500"/> Gestión del Cambio
        </span>
      </div>
    </div>
  )
}

// ─── Sub-componente: BarraProgreso ────────────────────────────────────────────

function BarraProgreso({ porcentaje, mensaje }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs text-slate-600">
        <span className="truncate max-w-xs">{mensaje}</span>
        <span className="font-medium tabular-nums">{porcentaje}%</span>
      </div>
      <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-700 rounded-full transition-all duration-150"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  )
}

// ─── Sub-componente: Chip de resumen ──────────────────────────────────────────

function ChipResumen({ count, label, color }) {
  const colors = {
    green:  'bg-green-50 text-green-800 border-green-200',
    blue:   'bg-blue-50 text-blue-800 border-blue-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
    orange: 'bg-orange-50 text-orange-800 border-orange-200',
  }
  return (
    <div className={['flex flex-col items-center px-5 py-3 rounded-xl border', colors[color]].join(' ')}>
      <span className="text-2xl font-bold tabular-nums">{count}</span>
      <span className="text-xs font-medium mt-0.5">{label}</span>
    </div>
  )
}

// ─── Sub-componente: TablaPreview (genérica) ──────────────────────────────────

function TablaPreview({ headers, rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left text-slate-600 font-semibold uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-3 py-6 text-center text-slate-400">
                Sin registros
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2 text-slate-700 max-w-[240px] truncate">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─── Sub-componente: Tarjeta de resultado ─────────────────────────────────────

function TarjetaResultado({ stats }) {
  const filas = [
    ['EPP importados (nuevos)',          stats.eppImportados,          'text-green-700'],
    ['EPP actualizados',                 stats.eppActualizados,        'text-blue-700'],
    ['Cargos importados (nuevos)',        stats.cargosImportados,       'text-green-700'],
    ['Cargos actualizados',              stats.cargosActualizados,     'text-blue-700'],
    ['Asignaciones nuevas',              stats.asignacionesImportadas, 'text-green-700'],
    ['Asignaciones duplicadas (omitidas)',stats.asignacionesDuplicadas,'text-slate-500'],
    ['Versiones de cambio importadas',   stats.cambiosImportados,      'text-purple-700'],
  ]
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <tbody>
          {filas.map(([label, valor, colorClass]) => (
            <tr key={label} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-2.5 text-slate-600">{label}</td>
              <td className={['px-4 py-2.5 text-right font-semibold tabular-nums', colorClass].join(' ')}>
                {valor}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ImportarExcel() {
  const [fase,      setFase]      = useState(FASE.INICIAL)
  const [archivo,   setArchivo]   = useState(null)
  const [datos,     setDatos]     = useState(null)   // resultado de parseCompleto
  const [progreso,  setProgreso]  = useState({ pct: 0, msg: '' })
  const [resultado, setResultado] = useState(null)   // stats de guardarImportacion
  const [errorMsg,  setErrorMsg]  = useState('')
  const [tabActiva, setTabActiva] = useState('epps')

  // ── Paso 1: seleccionar archivo → parsear ──────────────────────────────────
  const handleArchivo = useCallback(async (file) => {
    setArchivo(file)
    setFase(FASE.PROCESANDO)
    try {
      const resultado = await parseCompleto(file)
      setDatos(resultado)
      setTabActiva('epps')
      setFase(FASE.PREVIEW)
    } catch (err) {
      setErrorMsg(err.message || 'Error inesperado al leer el archivo.')
      setFase(FASE.ERROR)
    }
  }, [])

  // ── Paso 2: confirmar → guardar en Dexie ──────────────────────────────────
  const handleConfirmar = async () => {
    setFase(FASE.GUARDANDO)
    setProgreso({ pct: 0, msg: 'Iniciando…' })
    try {
      const stats = await guardarImportacion(datos, (pct, msg) => {
        setProgreso({ pct, msg })
      })
      setResultado(stats)
      setFase(FASE.COMPLETADO)
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar los datos.')
      setFase(FASE.ERROR)
    }
  }

  // ── Reiniciar ──────────────────────────────────────────────────────────────
  const reiniciar = () => {
    setFase(FASE.INICIAL); setArchivo(null); setDatos(null)
    setProgreso({ pct: 0, msg: '' }); setResultado(null); setErrorMsg('')
  }

  // ─── Datos para preview ────────────────────────────────────────────────────
  const TABS = datos ? [
    { key: 'epps',         label: `EPP (${datos.epps.length})`,                Icon: Table2  },
    { key: 'cargos',       label: `Cargos (${datos.cargos.length})`,            Icon: Users   },
    { key: 'asignaciones', label: `Asignaciones (${datos.asignaciones.length})`,Icon: Link2   },
    { key: 'cambios',      label: `Cambios (${datos.cambios.length})`,          Icon: History },
  ] : []

  const asignsPorCargo = datos
    ? datos.cargos.map((c) => ({
        cargo: c,
        total: datos.asignaciones.filter((a) => a.cargoNombre === c).length,
      }))
    : []

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* ── Cabecera ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet size={22} className="text-primary-700" strokeWidth={1.8} />
            Importar Matriz MT-SST-005
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Carga el archivo Excel oficial para sincronizar EPP, cargos y asignaciones.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={descargarFormatoMatriz} iconLeft={<Download size={14} />}>
            Descargar formato
          </Button>
          {fase !== FASE.INICIAL && (
            <Button variant="ghost" size="sm" onClick={reiniciar} iconLeft={<RefreshCw size={14} />}>
              Reiniciar
            </Button>
          )}
        </div>
      </div>

      {/* ── Indicador de pasos ── */}
      <div className="flex items-center gap-1 text-xs text-slate-400 select-none">
        {[
          { f: FASE.INICIAL,    n: 1, label: 'Seleccionar' },
          { f: FASE.PROCESANDO, n: 2, label: 'Analizar'    },
          { f: FASE.PREVIEW,    n: 3, label: 'Revisar'     },
          { f: FASE.GUARDANDO,  n: 4, label: 'Guardar'     },
          { f: FASE.COMPLETADO, n: 5, label: 'Listo'       },
        ].map(({ f, n, label }, i, arr) => {
          const fases   = Object.values(FASE)
          const faseIdx = fases.indexOf(fase)
          const pasoIdx = fases.indexOf(f)
          const activo  = fase === f
          const hecho   = faseIdx > pasoIdx
          return (
            <div key={f} className="flex items-center gap-1">
              <div className={[
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium',
                activo ? 'bg-primary-800 text-white'  :
                hecho  ? 'bg-green-100 text-green-700' : 'text-slate-400',
              ].join(' ')}>
                {hecho
                  ? <CheckCircle2 size={12} />
                  : <span className="text-[10px] font-bold">{n}</span>
                }
                <span>{label}</span>
              </div>
              {i < arr.length - 1 && <ChevronRight size={13} className="text-slate-300 flex-shrink-0" />}
            </div>
          )
        })}
      </div>

      {/* ════ FASE: INICIAL ════════════════════════════════════════════════════ */}
      {fase === FASE.INICIAL && (
        <>
          <AlertBanner
            level="info"
            message="El archivo será analizado localmente en tu equipo. Ningún dato se enviará a servidores externos."
          />
          <DropZone onArchivo={handleArchivo} ocupado={false} />
        </>
      )}

      {/* ════ FASE: PROCESANDO ═════════════════════════════════════════════════ */}
      {fase === FASE.PROCESANDO && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-primary-700 animate-spin" strokeWidth={1.5} />
          <div className="text-center">
            <p className="font-semibold text-slate-800">Analizando archivo…</p>
            <p className="text-sm text-slate-400 mt-1">{archivo?.name}</p>
          </div>
        </div>
      )}

      {/* ════ FASE: PREVIEW ════════════════════════════════════════════════════ */}
      {fase === FASE.PREVIEW && datos && (
        <div className="space-y-4">

          {/* Chips de resumen */}
          <div className="flex flex-wrap gap-3">
            <ChipResumen count={datos.epps.length}         label="EPP encontrados"  color="green"  />
            <ChipResumen count={datos.cargos.length}       label="Cargos"           color="blue"   />
            <ChipResumen count={datos.asignaciones.length} label="Asignaciones"     color="purple" />
            <ChipResumen count={datos.cambios.length}      label="Versiones cambio" color="orange" />
          </div>

          {/* Alertas del parser */}
          {datos.errores.length > 0 && (
            <AlertBanner
              level="danger"
              message={`${datos.errores.length} error(es) al leer: ${datos.errores[0]}${datos.errores.length > 1 ? ' …' : ''}`}
            />
          )}
          {datos.advertencias.length > 0 && (
            <AlertBanner
              level="warning"
              message={`${datos.advertencias.length} advertencia(s): ${datos.advertencias[0]}${datos.advertencias.length > 1 ? ' …' : ''}`}
            />
          )}

          {/* Tabs de preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Barra de tabs */}
            <div className="flex border-b border-slate-200 overflow-x-auto">
              {TABS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setTabActiva(key)}
                  className={[
                    'flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap',
                    'border-b-2 transition-colors',
                    tabActiva === key
                      ? 'border-primary-700 text-primary-800 bg-primary-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Contenido de tabs */}
            <div className="p-4 max-h-80 overflow-y-auto">
              {tabActiva === 'epps' && (
                <TablaPreview
                  headers={['Ítem', 'Nombre EPP', 'Categoría', 'Norma', 'Vida útil (días)']}
                  rows={datos.epps.map((e) => [
                    e.item, e.nombre, e.categoria || '—', e.norma || '—', e.vidaUtilDias,
                  ])}
                />
              )}
              {tabActiva === 'cargos' && (
                <TablaPreview
                  headers={['#', 'Nombre del cargo', 'EPP asignados']}
                  rows={asignsPorCargo.map((a, i) => [
                    i + 1, a.cargo, a.total,
                  ])}
                />
              )}
              {tabActiva === 'asignaciones' && (
                <TablaPreview
                  headers={['Cargo', 'Ítem EPP']}
                  rows={datos.asignaciones.slice(0, 200).map((a) => [
                    a.cargoNombre, `EPP #${a.eppItem}`,
                  ])}
                />
              )}
              {tabActiva === 'cambios' && (
                <TablaPreview
                  headers={['Versión', 'Fecha', 'Descripción', 'Responsable']}
                  rows={datos.cambios.map((c) => [
                    c.version, c.fecha, c.descripcion || '—', c.responsable || '—',
                  ])}
                />
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-between gap-3">
            <Button variant="secondary" onClick={reiniciar}>
              Cancelar
            </Button>
            {datos.errores.length === 0 ? (
              <Button variant="primary" onClick={handleConfirmar}>
                Confirmar e importar
              </Button>
            ) : (
              <Button variant="danger" onClick={handleConfirmar}>
                Importar con errores
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ════ FASE: GUARDANDO ══════════════════════════════════════════════════ */}
      {fase === FASE.GUARDANDO && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={36} className="text-primary-700 animate-spin" strokeWidth={1.5} />
            <p className="font-semibold text-slate-800">Guardando en la base de datos local…</p>
          </div>
          <BarraProgreso porcentaje={progreso.pct} mensaje={progreso.msg} />
        </div>
      )}

      {/* ════ FASE: COMPLETADO ═════════════════════════════════════════════════ */}
      {fase === FASE.COMPLETADO && resultado && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-start gap-4">
            <CheckCircle2 size={28} className="text-green-600 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
            <div>
              <p className="font-semibold text-green-900 text-base">¡Importación completada con éxito!</p>
              <p className="text-sm text-green-700 mt-0.5">
                Los datos de la Matriz MT-SST-005 han sido sincronizados en GEPPI.
              </p>
            </div>
          </div>

          <TarjetaResultado stats={resultado} />

          {resultado.errores.length > 0 && (
            <AlertBanner
              level="warning"
              message={`${resultado.errores.length} elemento(s) no pudieron guardarse: ${resultado.errores[0]}`}
              closable
            />
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={reiniciar} iconLeft={<RefreshCw size={14} />}>
              Importar otro archivo
            </Button>
          </div>
        </div>
      )}

      {/* ════ FASE: ERROR ══════════════════════════════════════════════════════ */}
      {fase === FASE.ERROR && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
          <XCircle size={36} className="text-red-500" strokeWidth={1.5} />
          <div>
            <p className="font-semibold text-red-800 text-base">Error al procesar el archivo</p>
            <p className="text-sm text-red-700 mt-1 max-w-sm">{errorMsg}</p>
          </div>
          <Button variant="secondary" onClick={reiniciar} iconLeft={<RefreshCw size={14} />}>
            Intentar de nuevo
          </Button>
        </div>
      )}

    </div>
  )
}
