import { useState, useEffect, useMemo, useRef } from 'react'
import { Briefcase, Plus, AlertTriangle, Download, Upload } from 'lucide-react'
import * as XLSX from 'xlsx'
import { cargoDB, trabajadorDB, asignacionDB, empresaDB } from '@/db'
import { Badge, Button, Card, DataTable, Modal } from '@/components/ui'
import CargoModal from '@/pages/MatrizCargos/CargoModal'

function descargarFormatoCargos(empresas) {
  const wb = XLSX.utils.book_new()
  const encabezado = [['cargo', 'empresa']]
  const ejemplos = empresas.length > 0
    ? empresas.slice(0, 3).map(e => ['EJEMPLO CARGO', e.razonSocial])
    : [['ALMACENISTA', 'Corporación para el Fomento del Bienestar Social']]
  const ws = XLSX.utils.aoa_to_sheet([...encabezado, ...ejemplos])
  ws['!cols'] = [{ wch: 40 }, { wch: 60 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Cargos')
  XLSX.writeFile(wb, 'formato_importacion_cargos.xlsx')
}

// Lee la primera columna ("cargo") del formato de importación y devuelve
// los nombres no vacíos, sin encabezado.
async function parseCargosDesdeExcel(file) {
  const buffer = await file.arrayBuffer()
  const wb     = XLSX.read(buffer, { type: 'array' })
  const ws     = wb.Sheets[wb.SheetNames[0]]
  const filas  = XLSX.utils.sheet_to_json(ws, { header: 1 })

  const nombres = filas
    .slice(1) // saltar encabezado
    .map(fila => String(fila[0] ?? '').trim())
    .filter(Boolean)

  return [...new Set(nombres)]
}

function exportarListadoCargos(cargos) {
  const fecha = new Date().toISOString().slice(0, 10)
  const filas = cargos.map(c => ({
    'Nombre del cargo': c.nombre,
    'Nivel':            c.nivel || '—',
    'Estado':           c.estado,
    'Trabajadores':     c._trabajadores,
    'EPP asignados':    c._eppAsignados,
  }))
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(filas)
  ws['!cols'] = [{ wch: 44 }, { wch: 22 }, { wch: 12 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Cargos')
  XLSX.writeFile(wb, `Listado_Cargos_${fecha}.xlsx`)
}

// ─── Modal de confirmación eliminación ───────────────────────────────────────
function ConfirmarEliminar({ cargo, onConfirmar, onClose, saving }) {
  return (
    <Modal open onClose={onClose} title="Eliminar cargo" size="sm"
           footer={
             <>
               <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
               <Button variant="danger" onClick={onConfirmar} loading={saving}>Eliminar</Button>
             </>
           }>
      <div className="flex gap-3 items-start">
        <AlertTriangle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-800">{cargo?.nombre}</p>
          {cargo?._trabajadores > 0 && (
            <p className="text-xs text-amber-700 mt-1 bg-amber-50 border border-amber-200 rounded p-2">
              Este cargo tiene {cargo._trabajadores} trabajador(es) asignado(s).
              Al eliminar, quedarán sin cargo.
            </p>
          )}
          <p className="text-xs text-slate-400 mt-1">
            También se eliminarán sus asignaciones de EPP. Esta acción no se puede deshacer.
          </p>
        </div>
      </div>
    </Modal>
  )
}

// ─── Columnas DataTable ───────────────────────────────────────────────────────
const COLUMNAS = [
  { key: 'nombre', label: 'Nombre del cargo', sortable: true },
  {
    key: 'nivel', label: 'Nivel', sortable: true, width: 'w-28',
    render: v => v ? <span className="text-xs text-slate-500">{v}</span> : null,
  },
  {
    key: '_trabajadores', label: 'Trabajadores', sortable: true, align: 'center', width: 'w-28',
    render: v => (
      <Badge variant={v > 0 ? 'primary' : 'neutral'} size="sm">{v}</Badge>
    ),
  },
  {
    key: '_eppAsignados', label: 'EPP asignados', sortable: true, align: 'center', width: 'w-28',
    render: v => (
      <Badge variant={v > 0 ? 'success' : 'neutral'} size="sm">{v}</Badge>
    ),
  },
  {
    key: 'estado', label: 'Estado', align: 'center', width: 'w-24',
    render: v => (
      <Badge variant={v === 'ACTIVO' ? 'success' : 'neutral'}>
        {v === 'ACTIVO' ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
]

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Page() {
  const [cargos,    setCargos]    = useState([])
  const [empresas,  setEmpresas]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)

  const [modal,     setModal]     = useState(null)   // null | {} | cargo
  const [confirmar, setConfirmar] = useState(null)   // null | cargo enriquecido
  const [importando, setImportando] = useState(false)
  const fileInputRef = useRef(null)

  // ── Carga ─────────────────────────────────────────────────────────────────
  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const [cgs, trabs, asigs, emps] = await Promise.all([
        cargoDB.getAll(),
        trabajadorDB.getAll(),
        asignacionDB.getAll(),
        empresaDB.getAll(),
      ])
      setEmpresas(emps || [])
      // Contar trabajadores y EPP por cargo
      const trabPorCargo = {}
      ;(trabs || []).filter(t => t.estado === 'ACTIVO').forEach(t => {
        trabPorCargo[t.cargoId] = (trabPorCargo[t.cargoId] || 0) + 1
      })
      const eppPorCargo = {}
      ;(asigs || []).filter(a => a.vigente !== false).forEach(a => {
        eppPorCargo[a.cargoId] = (eppPorCargo[a.cargoId] || 0) + 1
      })
      setCargos(
        (cgs || []).map(c => ({
          ...c,
          _trabajadores: trabPorCargo[c.id] || 0,
          _eppAsignados: eppPorCargo[c.id]  || 0,
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const guardar = async (data) => {
    setSaving(true)
    try {
      if (modal?.id) {
        await cargoDB.update(modal.id, data)
      } else {
        await cargoDB.create(data)
      }
      setModal(null)
      await cargar()
    } catch (err) {
      alert(err.message?.includes('nombre')
        ? 'Ya existe un cargo con ese nombre.'
        : `Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const eliminar = async () => {
    if (!confirmar) return
    setSaving(true)
    try {
      await asignacionDB.limpiarPorCargo(confirmar.id)
      await cargoDB.remove(confirmar.id)
      setConfirmar(null)
      await cargar()
    } finally {
      setSaving(false)
    }
  }

  // ── Importar desde Excel ─────────────────────────────────────────────────
  const handleImportar = async (file) => {
    if (!file) return
    setImportando(true)
    try {
      const nombres = await parseCargosDesdeExcel(file)
      if (nombres.length === 0) {
        alert('El archivo no tiene nombres de cargo en la primera columna.')
        return
      }
      const existentes = new Set(cargos.map(c => c.nombre.toUpperCase().trim()))
      let creados = 0, omitidos = 0, errores = 0
      for (const nombre of nombres) {
        if (existentes.has(nombre.toUpperCase().trim())) { omitidos++; continue }
        try {
          await cargoDB.create({ nombre })
          existentes.add(nombre.toUpperCase().trim())
          creados++
        } catch {
          errores++
        }
      }
      await cargar()
      alert(`Importación completada: ${creados} cargo(s) nuevo(s), ${omitidos} ya existían${errores ? `, ${errores} con error` : ''}.`)
    } catch (err) {
      alert(`Error al leer el archivo: ${err.message}`)
    } finally {
      setImportando(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const activos   = useMemo(() => cargos.filter(c => c.estado === 'ACTIVO').length,   [cargos])
  const inactivos = useMemo(() => cargos.filter(c => c.estado === 'INACTIVO').length, [cargos])

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase size={22} className="text-primary-700" strokeWidth={1.8} />
            Cargos
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {activos} activo{activos !== 1 ? 's' : ''} · {inactivos} inactivo{inactivos !== 1 ? 's' : ''} · {cargos.length} total.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" iconLeft={Download} onClick={() => exportarListadoCargos(cargos)}
            disabled={cargos.length === 0}>
            Exportar listado
          </Button>
          <Button variant="secondary" iconLeft={Download} onClick={() => descargarFormatoCargos(empresas)}>
            Descargar formato
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={e => handleImportar(e.target.files[0])}
          />
          <Button variant="secondary" iconLeft={Upload} loading={importando}
            onClick={() => fileInputRef.current?.click()}>
            Importar Excel
          </Button>
          <Button iconLeft={Plus} onClick={() => setModal({})}>
            Nuevo cargo
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <Card noPadding>
        <DataTable
          columns={COLUMNAS}
          data={cargos}
          loading={loading}
          searchPlaceholder="Buscar cargo por nombre o nivel…"
          emptyTitle="Sin cargos registrados"
          emptyMessage="Importa la Matriz MT-SST-005 en Configuración o crea los cargos manualmente."
          onEdit={row  => setModal(row)}
          onDelete={row => setConfirmar(row)}
          className="p-4"
        />
      </Card>

      {/* Modal crear / editar */}
      {modal !== null && (
        <CargoModal
          cargo={modal?.id ? modal : null}
          onSave={guardar}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {/* Confirmar eliminación */}
      {confirmar && (
        <ConfirmarEliminar
          cargo={confirmar}
          onConfirmar={eliminar}
          onClose={() => setConfirmar(null)}
          saving={saving}
        />
      )}
    </div>
  )
}
