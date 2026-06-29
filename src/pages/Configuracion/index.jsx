import { useState, useEffect }  from 'react'
import {
  Download, Upload, RotateCcw, Info,
  Wifi, Database, AlertTriangle, CheckCircle2, Loader2,
} from 'lucide-react'
import dbSchema                    from '@/db/schema'
import { trabajadorDB, eppDB, entregaDB, sedeDB } from '@/db'
import { initSeedData }            from '@/db/seed'
import { SISTEMA }                 from '@/constants'
import { Card, Button, AlertBanner, Modal } from '@/components/ui'
import ImportarExcel               from './ImportarExcel'

// ─── Helper: descargar blob como archivo ─────────────────────────────────────
function descargarBlob(contenido, nombre, tipo = 'application/json') {
  const blob = new Blob([contenido], { type: tipo })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = nombre; a.click()
  URL.revokeObjectURL(url)
}

// ─── Sección 1: Importar Matriz ───────────────────────────────────────────────
// (componente completo importado desde PROMPT-06)

// ─── Sección 2: Respaldar y restaurar ────────────────────────────────────────
function SeccionRespaldo() {
  const [exportando,  setExportando]  = useState(false)
  const [restaurando, setRestaurando] = useState(false)
  const [msgExito,    setMsgExito]    = useState('')
  const [msgError,    setMsgError]    = useState('')

  const exportar = async () => {
    setExportando(true); setMsgExito(''); setMsgError('')
    try {
      const tablas = [
        'empresa', 'sede', 'centroDeTrabajo', 'cargo', 'epp',
        'asignacionCargoEpp', 'trabajador', 'inventario', 'movimientoInventario',
        'entrega', 'detalleEntrega', 'firma', 'gestionCambio',
      ]
      const datos = {}
      for (const nombre of tablas) {
        datos[nombre] = await dbSchema[nombre].toArray()
      }
      const respaldo = {
        meta: {
          sistema:          SISTEMA.NOMBRE,
          version:          SISTEMA.VERSION,
          documento:        SISTEMA.CODIGO_DOCUMENTO,
          versionMatriz:    SISTEMA.VERSION_MATRIZ,
          fechaExportacion: new Date().toISOString(),
        },
        datos,
      }
      const fecha = new Date().toISOString().slice(0, 10)
      descargarBlob(JSON.stringify(respaldo, null, 2), `GEPPI_respaldo_${fecha}.json`)
      setMsgExito('Respaldo descargado correctamente.')
    } catch (err) {
      setMsgError(`Error al exportar: ${err.message}`)
    } finally {
      setExportando(false)
    }
  }

  const restaurar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setRestaurando(true); setMsgExito(''); setMsgError('')
    try {
      const texto    = await file.text()
      const respaldo = JSON.parse(texto)
      if (!respaldo?.datos) throw new Error('El archivo no parece un respaldo válido de GEPPI.')

      for (const [nombre, registros] of Object.entries(respaldo.datos)) {
        if (!dbSchema[nombre]) continue
        await dbSchema[nombre].clear()
        if (registros?.length) await dbSchema[nombre].bulkAdd(registros)
      }
      setMsgExito(`Restauración completada. La página se recargará en 2 s.`)
      setTimeout(() => window.location.reload(), 2000)
    } catch (err) {
      setMsgError(`Error al restaurar: ${err.message}`)
    } finally {
      setRestaurando(false)
      e.target.value = ''
    }
  }

  return (
    <Card title="Respaldar y restaurar datos" subtitle="Copia de seguridad local en formato JSON">
      <div className="grid sm:grid-cols-2 gap-4">

        {/* Exportar */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <Download size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              Descarga un archivo JSON con toda la información del sistema (empresa, sedes,
              trabajadores, EPP, entregas y firmas digitales).
            </p>
          </div>
          <Button
            variant="outline"
            iconLeft={Download}
            onClick={exportar}
            loading={exportando}
          >
            {exportando ? 'Exportando…' : 'Descargar respaldo JSON'}
          </Button>
        </div>

        {/* Importar / Restaurar */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <Upload size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Restaura desde un archivo JSON generado por GEPPI.
              <strong> Reemplazará todos los datos actuales.</strong>
            </p>
          </div>
          <label className={[
            'inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-slate-300',
            'text-sm font-medium text-slate-700 bg-white hover:bg-slate-50',
            'cursor-pointer transition-colors',
            restaurando ? 'opacity-50 pointer-events-none' : '',
          ].join(' ')}>
            {restaurando ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {restaurando ? 'Restaurando…' : 'Restaurar desde archivo'}
            <input type="file" accept=".json" className="hidden" onChange={restaurar} />
          </label>
        </div>

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
    ? `${window.location.protocol}//${window.location.hostname}:${window.location.port || '5173'}`
    : '—'

  const INFO = [
    ['Sistema',              SISTEMA.NOMBRE_COMPLETO     ],
    ['Versión GEPPI',        `v${SISTEMA.VERSION}`       ],
    ['Matriz referencia',    SISTEMA.CODIGO_DOCUMENTO     ],
    ['Versión de la Matriz', `v${SISTEMA.VERSION_MATRIZ}` ],
    ['Responsable matriz',   SISTEMA.RESPONSABLE_MATRIZ   ],
    ['Normativa',            SISTEMA.NORMATIVA            ],
    ['Almacenamiento',       'IndexedDB (local)'          ],
    ['Acceso en red',        urlActual                    ],
  ]

  return (
    <Card title="Información del sistema" subtitle={`GEPPI v${SISTEMA.VERSION}`}>
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

// ─── Sección 4: Zona de peligro ───────────────────────────────────────────────
function SeccionPeligro() {
  const [modal,        setModal]        = useState(false)
  const [confirmText,  setConfirmText]  = useState('')
  const [reiniciando,  setReiniciando]  = useState(false)

  const confirmaOk = confirmText === 'REINICIAR'

  const ejecutarReinicio = async () => {
    if (!confirmaOk) return
    setReiniciando(true)
    try {
      const tablas = [
        'empresa', 'sede', 'centroDeTrabajo', 'cargo', 'epp',
        'asignacionCargoEpp', 'trabajador', 'inventario', 'movimientoInventario',
        'entrega', 'detalleEntrega', 'firma', 'alerta', 'gestionCambio', 'auditoria',
      ]
      await Promise.all(tablas.map(t => dbSchema[t]?.clear()))
      await initSeedData()
      window.location.reload()
    } catch (err) {
      alert(`Error: ${err.message}`)
      setReiniciando(false)
    }
  }

  return (
    <>
      <Card className="border-red-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-800 mb-1">Zona de peligro</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Reiniciar a datos de muestra</strong> borrará toda la información actual
              (trabajadores, entregas, inventario, firmas) y cargará los datos de prueba del
              MT-SST-005 v007. Esta acción es <strong>irreversible</strong> salvo que tengas un respaldo.
            </p>
            <Button
              variant="danger"
              size="sm"
              iconLeft={RotateCcw}
              onClick={() => { setModal(true); setConfirmText('') }}
              className="mt-3"
            >
              Reiniciar a datos de muestra
            </Button>
          </div>
        </div>
      </Card>

      {/* Modal de confirmación con texto */}
      {modal && (
        <Modal
          open
          onClose={() => setModal(false)}
          title="¿Confirmar reinicio?"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setModal(false)} disabled={reiniciando}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={ejecutarReinicio}
                loading={reiniciando}
                disabled={!confirmaOk}
              >
                Sí, reiniciar todo
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <AlertBanner
              level="danger"
              message="Se eliminarán TODOS los datos. Asegúrate de tener un respaldo antes de continuar."
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Escribe <strong className="text-red-700">REINICIAR</strong> para confirmar:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="REINICIAR"
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-sm
                           font-mono focus:outline-none focus:ring-2 focus:ring-red-400
                           focus:border-red-400"
                autoFocus
              />
            </div>
          </div>
        </Modal>
      )}
    </>
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
          Importación de la Matriz, respaldo de datos y parámetros del sistema.
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

      {/* Sección 4: Zona de peligro */}
      <SeccionPeligro />

    </div>
  )
}
