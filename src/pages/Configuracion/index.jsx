import { useState, useEffect }  from 'react'
import {
  Download, Wifi, CheckCircle2, Loader2,
} from 'lucide-react'
import { supabase }                from '@/lib/supabase'
import { hoyISO }                  from '@/utils/dates'
import { trabajadorDB, eppDB, entregaDB, sedeDB } from '@/db'
import { SISTEMA }                 from '@/constants'
import { Card, Button, AlertBanner } from '@/components/ui'
import ImportarExcel               from './ImportarExcel'

// ─── Sección 1: Importar Matriz ───────────────────────────────────────────────

// ─── Sección 2: Descargar todo a Excel ──────────────────────────────────────
// El respaldo real de la base lo hace el servidor; esto es una copia de consulta.
const TABLAS_EXPORTAR = [
  ['empresa', 'Empresas'], ['sede', 'Sedes'], ['cargo', 'Cargos'], ['epp', 'Matriz EPP'],
  ['asignacion_cargo_epp', 'EPP por cargo'], ['trabajador', 'Trabajadores'],
  ['inventario', 'Inventario'], ['movimiento_inventario', 'Kardex'],
  ['entrega', 'Entregas'], ['detalle_entrega', 'Detalle entregas'], ['alerta', 'Alertas'],
  ['inspeccion', 'Inspecciones'], ['extintor', 'Extintores'], ['vehiculo', 'Vehiculos'],
  ['checklist_preoperacional', 'Checklist preoperacional'], ['plan_trabajo', 'Plan de trabajo'],
  ['condicion_insegura', 'Actos y condiciones'], ['examen_medico', 'Examenes medicos'],
  ['indicador', 'Indicadores'], ['dato_indicador', 'Datos indicadores'],
  ['evaluacion_sgsst', 'Evaluaciones 0312'], ['item_evaluacion', 'Items 0312'],
  ['hallazgo', 'Hallazgos'], ['gestion_cambio', 'Gestion del cambio'], ['auditoria', 'Auditoria'],
]
const EXCLUIR = new Set(['token_aceptacion', 'firma_base64'])

async function leerTabla(tabla) {
  const filas = []
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabase.from(tabla).select('*').order('id').range(desde, desde + 999)
    if (error) throw error
    filas.push(...(data || []))
    if (!data || data.length < 1000) return filas
  }
}

function limpiarFila(fila) {
  const r = {}
  for (const [k, v] of Object.entries(fila)) {
    if (EXCLUIR.has(k)) continue
    const val = v !== null && typeof v === 'object' ? JSON.stringify(v) : v
    r[k] = typeof val === 'string' && val.length > 32000 ? val.slice(0, 32000) + '…' : val
  }
  return r
}

function SeccionRespaldo() {
  const [exportando, setExportando] = useState(false)
  const [progreso,   setProgreso]   = useState('')
  const [msgExito,   setMsgExito]   = useState('')
  const [msgError,   setMsgError]   = useState('')

  const exportar = async () => {
    setExportando(true); setMsgExito(''); setMsgError('')
    try {
      const XLSX = await import('xlsx')
      const wb = XLSX.utils.book_new()
      const omitidas = []
      let total = 0
      for (const [tabla, hoja] of TABLAS_EXPORTAR) {
        setProgreso(hoja)
        try {
          const filas = (await leerTabla(tabla)).map(limpiarFila)
          total += filas.length
          const ws = filas.length ? XLSX.utils.json_to_sheet(filas) : XLSX.utils.aoa_to_sheet([['Sin registros']])
          XLSX.utils.book_append_sheet(wb, ws, hoja.slice(0, 31))
        } catch {
          omitidas.push(hoja)
        }
      }
      XLSX.writeFile(wb, `SST_Fombisol_datos_${hoyISO()}.xlsx`)
      setMsgExito(`Archivo descargado: ${total.toLocaleString('es-CO')} registros.`
        + (omitidas.length ? ` No se pudieron leer: ${omitidas.join(', ')}.` : ''))
    } catch (err) {
      setMsgError(`No se pudo generar el archivo: ${err.message}`)
    } finally {
      setExportando(false); setProgreso('')
    }
  }

  return (
    <Card title="Descargar todos los datos" subtitle="Copia de consulta en Excel, una hoja por módulo">
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
          <Download size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            Descarga un Excel con empresas, sedes, trabajadores, matriz de EPP, inventario, entregas,
            inspecciones, plan de trabajo, exámenes, indicadores y demás módulos. Las firmas y los
            enlaces de firma no se incluyen. El respaldo completo de la base lo hace el servidor.
          </p>
        </div>
        <Button variant="outline" iconLeft={Download} onClick={exportar} loading={exportando}>
          {exportando ? `Leyendo ${progreso}…` : 'Descargar todo a Excel'}
        </Button>
      </div>

      {msgExito && (
        <div className="flex items-center gap-2 text-sm text-green-700 mt-3">
          <CheckCircle2 size={14} /> {msgExito}
        </div>
      )}
      {msgError && (
        <AlertBanner level="danger" message={msgError} closable className="mt-3" />
      )}
    </Card>
  )
}

// ─── Sección 3: Información del sistema ──────────────────────────────────────
function SeccionInfo() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function cargar() {
      try {
        const [trabs, eps, ents, sds] = await Promise.all([
          trabajadorDB.getAll(),
          eppDB.getAll(),
          entregaDB.getAll(),
          sedeDB.getAll(),
        ])
        setStats({
          trabajadores: (trabs || []).filter(t => t.estado === 'ACTIVO').length,
          epps:         (eps   || []).filter(e => e.estado === 'ACTIVO').length,
          entregas:     (ents  || []).length,
          sedes:        (sds   || []).filter(s => s.estado === 'ACTIVO').length,
        })
      } catch { /* silencioso */ }
    }
    cargar()
  }, [])

  const urlActual = typeof window !== 'undefined'
    ? window.location.origin
    : '—'

  const INFO = [
    ['Sistema',              SISTEMA.NOMBRE_COMPLETO     ],
    ['Versión SST Fombisol',        `v${SISTEMA.VERSION}`       ],
    ['Matriz referencia',    SISTEMA.CODIGO_DOCUMENTO     ],
    ['Versión de la Matriz', `v${SISTEMA.VERSION_MATRIZ}` ],
    ['Responsable matriz',   SISTEMA.RESPONSABLE_MATRIZ   ],
    ['Normativa',            SISTEMA.NORMATIVA            ],
    ['Almacenamiento',       'Servidor de Fombisol (AWS)' ],
    ['Dirección',            urlActual                    ],
  ]

  return (
    <Card title="Información del sistema" subtitle={`SST Fombisol v${SISTEMA.VERSION}`}>
      <div className="grid sm:grid-cols-2 gap-6">

        {/* Tabla de información */}
        <dl className="space-y-2.5">
          {INFO.map(([label, val]) => (
            <div key={label} className="flex items-baseline gap-2">
              <dt className="text-xs font-semibold text-slate-500 min-w-[130px] shrink-0">{label}:</dt>
              <dd className="text-xs text-slate-800 break-all">{val}</dd>
            </div>
          ))}
        </dl>

        {/* Stats rápidos */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Datos en base de datos
          </p>
          {stats === null ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 size={14} className="animate-spin" /> Cargando…
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Trabajadores activos', val: stats.trabajadores, color: 'text-primary-800' },
                { label: 'EPP activos',          val: stats.epps,         color: 'text-teal-700'   },
                { label: 'Entregas totales',      val: stats.entregas,     color: 'text-green-700'  },
                { label: 'Sedes activas',         val: stats.sedes,        color: 'text-blue-700'   },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className={['text-2xl font-black tabular-nums', color].join(' ')}>{val}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Wifi size={14} className="text-primary-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600">
              Para acceder desde otras PCs o tablets de la misma red, usa:{' '}
              <span className="font-mono font-semibold text-primary-800">
                {typeof window !== 'undefined' ? window.location.host : ''}
              </span>
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Page() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      {/* Cabecera */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Importación de la Matriz, descarga de datos e información del sistema.
        </p>
      </div>

      {/* Sección 1: Importar Matriz */}
      <Card title="Importar Matriz MT-SST-005" subtitle="Sincroniza EPP, cargos y asignaciones desde el archivo Excel oficial">
        <ImportarExcel />
      </Card>

      {/* Sección 2: Respaldo */}
      <SeccionRespaldo />

      {/* Sección 3: Info del sistema */}
      <SeccionInfo />

    </div>
  )
}
