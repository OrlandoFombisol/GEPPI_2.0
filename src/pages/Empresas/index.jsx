import { useState, useEffect, useMemo, useRef } from 'react'
import { Building2, MapPin, Plus, Upload, AlertTriangle, PowerOff } from 'lucide-react'
import { empresaDB, sedeDB }                    from '@/db'
import { formatearNIT }                          from '@/utils/validators'
import { Badge, Button, Card, DataTable, Modal } from '@/components/ui'
import EmpresaModal                              from './EmpresaModal'
import SedeModal                                 from './SedeModal'
import { parsearEmpresas }                       from '@/services/importarEmpresas'

// ─── Columnas DataTable ───────────────────────────────────────────────────────

const COLS_EMPRESA = [
  {
    key: 'nit', label: 'NIT', sortable: true, width: 'w-36',
    render: v => <span className="font-mono text-xs text-slate-600">{formatearNIT(v)}</span>,
  },
  { key: 'razonSocial',        label: 'Razón Social',  sortable: true },
  { key: 'representanteLegal', label: 'Representante', sortable: true },
  { key: 'departamento',       label: 'Departamento',  sortable: true },
  { key: 'sector',             label: 'Sector',        sortable: true },
  {
    key: 'estado', label: 'Estado', align: 'center', width: 'w-24',
    render: v => (
      <Badge variant={v === 'ACTIVO' ? 'success' : 'neutral'}>
        {v === 'ACTIVO' ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
]

const COLS_SEDE = [
  { key: 'empresaNombre', label: 'Empresa',     sortable: true },
  { key: 'nombre',        label: 'Sede',         sortable: true },
  { key: 'municipio',     label: 'Municipio',    sortable: true },
  { key: 'departamento',  label: 'Departamento', sortable: true },
  { key: 'responsableSst',label: 'Resp. SST',    sortable: true },
  {
    key: 'estado', label: 'Estado', align: 'center', width: 'w-24',
    render: v => (
      <Badge variant={v === 'ACTIVO' ? 'success' : 'neutral'}>
        {v === 'ACTIVO' ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
]

// ─── Detalle modal ────────────────────────────────────────────────────────────

function Campo({ label, value }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-slate-800 mt-0.5 break-words">{value}</dd>
    </div>
  )
}

function ModalDetalle({ item, tipo, onClose }) {
  const esEmpresa = tipo === 'empresa'
  return (
    <Modal open onClose={onClose} title={esEmpresa ? item.razonSocial : item.nombre}
           size="md" footer={<Button variant="secondary" onClick={onClose}>Cerrar</Button>}>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        {esEmpresa ? (
          <>
            <Campo label="NIT"             value={formatearNIT(item.nit)} />
            <Campo label="Estado"          value={item.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'} />
            <Campo label="Representante"   value={item.representanteLegal} />
            <Campo label="Sector"          value={item.sector} />
            <Campo label="Departamento"    value={item.departamento} />
            <Campo label="Ciudad"          value={item.ciudad} />
            <Campo label="Dirección"       value={item.direccion} />
          </>
        ) : (
          <>
            <Campo label="Empresa"         value={item.empresaNombre} />
            <Campo label="Estado"          value={item.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'} />
            <Campo label="Departamento"    value={item.departamento} />
            <Campo label="Municipio"       value={item.municipio} />
            <Campo label="Dirección"       value={item.direccion} />
            <Campo label="Responsable SST" value={item.responsableSst} />
          </>
        )}
      </dl>
    </Modal>
  )
}

// ─── Confirmar desactivación ──────────────────────────────────────────────────

function ModalDesactivar({ item, onConfirm, onClose, saving }) {
  const esActivo = item?.estado === 'ACTIVO'
  return (
    <Modal open onClose={onClose}
           title={esActivo ? 'Desactivar empresa' : 'Reactivar empresa'}
           size="sm"
           footer={
             <>
               <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
               <Button
                 variant={esActivo ? 'danger' : 'primary'}
                 onClick={onConfirm}
                 loading={saving}
               >
                 {esActivo ? 'Desactivar' : 'Reactivar'}
               </Button>
             </>
           }>
      <div className="flex gap-3 items-start">
        <PowerOff size={22} className={esActivo ? 'text-red-500 flex-shrink-0 mt-0.5' : 'text-green-500 flex-shrink-0 mt-0.5'} />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800">
            {esActivo
              ? `¿Desactivar a ${item.nombre || item.razonSocial}?`
              : `¿Reactivar a ${item.nombre || item.razonSocial}?`}
          </p>
          <p className="text-xs text-slate-500">
            {esActivo
              ? 'La empresa quedará en estado inactivo. Sus registros e historial se conservan intactos.'
              : 'La empresa quedará en estado activo nuevamente.'}
          </p>
        </div>
      </div>
    </Modal>
  )
}

// ─── Modal importar Excel ─────────────────────────────────────────────────────

function ModalImportarEmpresas({ empresas: existentes, onImportadas, onClose }) {
  const [resultado,  setResultado]  = useState(null)
  const [cargando,   setCargando]   = useState(false)
  const [guardando,  setGuardando]  = useState(false)
  const [error,      setError]      = useState('')
  const fileRef = useRef()

  const procesarArchivo = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    setCargando(true)
    setError('')
    try {
      const res = await parsearEmpresas(archivo)
      setResultado(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  const confirmarImportacion = async () => {
    if (!resultado) return
    setGuardando(true)
    try {
      let creadas = 0, actualizadas = 0
      for (const emp of resultado.empresas) {
        const existente = existentes.find(e => e.nit === emp.nit)
        if (existente) {
          await empresaDB.update(existente.id, { ...emp, estado: 'ACTIVO' })
          actualizadas++
        } else {
          await empresaDB.create({ ...emp, estado: 'ACTIVO' })
          creadas++
        }
      }
      onImportadas({ creadas, actualizadas })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Importar empresas desde Excel" size="lg"
           footer={
             <>
               <Button variant="secondary" onClick={onClose} disabled={guardando}>Cancelar</Button>
               {resultado?.empresas?.length > 0 && (
                 <Button onClick={confirmarImportacion} loading={guardando}>
                   Importar {resultado.empresas.length} empresa(s)
                 </Button>
               )}
             </>
           }>
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
          <p className="font-semibold mb-1">Formato de columnas esperado:</p>
          <p>NIT · Razón Social · Representante Legal · Departamento · Ciudad · Dirección · Sector</p>
          <p className="mt-1 text-blue-600">Las columnas pueden estar en cualquier orden. La primera fila debe ser el encabezado.</p>
        </div>

        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={procesarArchivo}
            className="hidden"
          />
          <Button
            variant="secondary"
            iconLeft={Upload}
            onClick={() => fileRef.current?.click()}
            disabled={cargando}
            loading={cargando}
          >
            {cargando ? 'Procesando...' : 'Seleccionar archivo Excel'}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {resultado && (
          <div className="space-y-3">
            {resultado.errores.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-700 mb-1">Errores ({resultado.errores.length}):</p>
                {resultado.errores.map((e, i) => (
                  <p key={i} className="text-xs text-red-600">• {e}</p>
                ))}
              </div>
            )}
            {resultado.advertencias.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">Advertencias:</p>
                {resultado.advertencias.map((a, i) => (
                  <p key={i} className="text-xs text-amber-600">• {a}</p>
                ))}
              </div>
            )}
            {resultado.empresas.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 border-b border-slate-200">
                  Vista previa — {resultado.empresas.length} empresa(s) a importar
                </div>
                <div className="max-h-52 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-3 py-2 text-left text-slate-500 font-semibold">NIT</th>
                        <th className="px-3 py-2 text-left text-slate-500 font-semibold">Razón Social</th>
                        <th className="px-3 py-2 text-left text-slate-500 font-semibold">Departamento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.empresas.map((e, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0">
                          <td className="px-3 py-2 font-mono text-slate-600">{formatearNIT(e.nit)}</td>
                          <td className="px-3 py-2 text-slate-800">{e.razonSocial}</td>
                          <td className="px-3 py-2 text-slate-500">{e.departamento || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Page() {
  const [empresas, setEmpresas] = useState([])
  const [sedes,    setSedes]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('empresas')
  const [saving,   setSaving]   = useState(false)

  const [modalEmpresa,   setModalEmpresa]   = useState(null)
  const [modalSede,      setModalSede]      = useState(null)
  const [detalle,        setDetalle]        = useState(null)
  const [desactivar,     setDesactivar]     = useState(null)
  const [importarEmp,    setImportarEmp]    = useState(false)
  const [toast,          setToast]          = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const [emps, sds] = await Promise.all([empresaDB.getAll(), sedeDB.getAll()])
      setEmpresas(emps || [])
      setSedes(sds || [])
    } finally {
      setLoading(false)
    }
  }

  const sedesConEmpresa = useMemo(() =>
    sedes.map(s => ({
      ...s,
      empresaNombre: empresas.find(e => e.id === s.empresaId)?.razonSocial || '—',
    })),
    [sedes, empresas]
  )

  const guardarEmpresa = async (data) => {
    setSaving(true)
    try {
      modalEmpresa?.id
        ? await empresaDB.update(modalEmpresa.id, data)
        : await empresaDB.create(data)
      setModalEmpresa(null)
      await cargar()
    } finally {
      setSaving(false)
    }
  }

  const guardarSede = async (data) => {
    setSaving(true)
    try {
      modalSede?.id
        ? await sedeDB.update(modalSede.id, data)
        : await sedeDB.create(data)
      setModalSede(null)
      await cargar()
    } finally {
      setSaving(false)
    }
  }

  // Desactivar / Reactivar empresa (nunca eliminar)
  const toggleEstado = async () => {
    if (!desactivar) return
    setSaving(true)
    try {
      const nuevoEstado = desactivar.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
      await empresaDB.update(desactivar.id, { estado: nuevoEstado })
      setDesactivar(null)
      await cargar()
    } finally {
      setSaving(false)
    }
  }

  // Desactivar sede
  const pedirDesactivarSede = (row) => {
    setDesactivar({ ...row, tipo: 'sede', nombre: row.nombre })
  }

  const toggleEstadoSede = async () => {
    if (!desactivar || desactivar.tipo !== 'sede') return
    setSaving(true)
    try {
      const nuevoEstado = desactivar.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
      await sedeDB.update(desactivar.id, { estado: nuevoEstado })
      setDesactivar(null)
      await cargar()
    } finally {
      setSaving(false)
    }
  }

  const mostrarToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const TABS = [
    { key: 'empresas', label: `Empresas (${empresas.length})`, Icon: Building2 },
    { key: 'sedes',    label: `Sedes (${sedes.length})`,       Icon: MapPin    },
  ]

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Empresas y Sedes</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Organización contratante y sus centros de trabajo.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tab === 'empresas' && (
            <>
              <Button variant="secondary" iconLeft={Upload} onClick={() => setImportarEmp(true)}>
                Importar Excel
              </Button>
              <Button iconLeft={Plus} onClick={() => setModalEmpresa({})}>
                Nueva empresa
              </Button>
            </>
          )}
          {tab === 'sedes' && (
            <Button iconLeft={Plus} onClick={() => setModalSede({})}>
              Nueva sede
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium',
              'border-b-2 transition-colors',
              tab === key
                ? 'border-primary-700 text-primary-800'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            ].join(' ')}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tabla Empresas */}
      {tab === 'empresas' && (
        <Card noPadding>
          <DataTable
            columns={COLS_EMPRESA}
            data={empresas}
            loading={loading}
            searchPlaceholder="Buscar por NIT, razón social…"
            emptyTitle="Sin empresas registradas"
            emptyMessage="Crea la primera empresa o importa desde Excel."
            onView={row => setDetalle({ tipo: 'empresa', data: row })}
            onEdit={row => setModalEmpresa(row)}
            onDelete={row => setDesactivar(row)}
            className="p-4"
          />
        </Card>
      )}

      {/* Tabla Sedes */}
      {tab === 'sedes' && (
        <Card noPadding>
          <DataTable
            columns={COLS_SEDE}
            data={sedesConEmpresa}
            loading={loading}
            searchPlaceholder="Buscar por sede, municipio…"
            emptyTitle="Sin sedes registradas"
            emptyMessage="Crea la primera sede y vincúlala a una empresa."
            onView={row => setDetalle({ tipo: 'sede', data: row })}
            onEdit={row => setModalSede(row)}
            onDelete={pedirDesactivarSede}
            className="p-4"
          />
        </Card>
      )}

      {/* Modales */}
      {modalEmpresa !== null && (
        <EmpresaModal
          empresa={modalEmpresa?.id ? modalEmpresa : null}
          onSave={guardarEmpresa}
          onClose={() => setModalEmpresa(null)}
          saving={saving}
        />
      )}

      {modalSede !== null && (
        <SedeModal
          sede={modalSede?.id ? modalSede : null}
          empresas={empresas.filter(e => e.estado === 'ACTIVO')}
          onSave={guardarSede}
          onClose={() => setModalSede(null)}
          saving={saving}
        />
      )}

      {detalle && (
        <ModalDetalle item={detalle.data} tipo={detalle.tipo} onClose={() => setDetalle(null)} />
      )}

      {desactivar && (
        <ModalDesactivar
          item={desactivar}
          onConfirm={desactivar.tipo === 'sede' ? toggleEstadoSede : toggleEstado}
          onClose={() => setDesactivar(null)}
          saving={saving}
        />
      )}

      {importarEmp && (
        <ModalImportarEmpresas
          empresas={empresas}
          onImportadas={({ creadas, actualizadas }) => {
            setImportarEmp(false)
            cargar()
            mostrarToast(`Importación completada: ${creadas} creadas, ${actualizadas} actualizadas.`)
          }}
          onClose={() => setImportarEmp(false)}
        />
      )}
    </div>
  )
}
