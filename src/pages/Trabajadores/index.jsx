import { useState, useEffect, useMemo, useRef } from 'react'
import { Users, Plus, AlertTriangle, Upload, Download, X as XIcon } from 'lucide-react'
import { trabajadorDB, cargoDB, sedeDB, empresaDB } from '@/db'
import { formatearFecha }                            from '@/utils/dates'
import { obtenerIniciales }                          from '@/utils/formatters'
import { Badge, Button, Card, DataTable, Modal }     from '@/components/ui'
import TrabajadorModal                               from './TrabajadorModal'
import TrabajadorPerfil                              from './TrabajadorPerfil'
import { parsearTrabajadores, descargarFormatoTrabajadores } from '@/services/importarTrabajadores'

// ─── Avatar inline ────────────────────────────────────────────────────────────

function MiniAvatar({ nombres, apellidos }) {
  return (
    <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
      <span className="text-primary-800 text-[10px] font-bold">
        {obtenerIniciales(`${nombres} ${apellidos}`)}
      </span>
    </div>
  )
}

// ─── Columnas DataTable ───────────────────────────────────────────────────────

const colsBase = () => [
  {
    key: 'cedula', label: 'Cédula', sortable: true, width: 'w-28',
    render: v => <span className="font-mono text-xs text-slate-600">{v}</span>,
  },
  {
    key: 'nombres', label: 'Nombre', sortable: true,
    render: (v, row) => (
      <div className="flex items-center gap-2.5">
        <MiniAvatar nombres={v} apellidos={row.apellidos} />
        <span className="font-medium text-slate-800 truncate max-w-[180px]">
          {v} {row.apellidos}
        </span>
      </div>
    ),
  },
  { key: 'cargoNombre',   label: 'Cargo',   sortable: true },
  { key: 'sedeNombre',    label: 'Sede',    sortable: true },
  { key: 'empresaNombre', label: 'Empresa', sortable: true },
  {
    key: 'fechaIngreso', label: 'Ingreso', sortable: true, width: 'w-28',
    render: v => <span className="font-mono text-xs text-slate-500">{formatearFecha(v)}</span>,
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

// ─── Modal confirmar desactivación ───────────────────────────────────────────

function ModalConfirmar({ item, onConfirm, onClose, saving }) {
  return (
    <Modal open onClose={onClose} title="Desactivar trabajador" size="sm"
           footer={
             <>
               <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
               <Button variant="danger" onClick={onConfirm} loading={saving}>Desactivar</Button>
             </>
           }>
      <div className="flex gap-3 items-start">
        <AlertTriangle size={22} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800">
            ¿Desactivar a {item.nombres} {item.apellidos}?
          </p>
          <p className="text-xs text-slate-500">
            El registro se conserva en el historial pero el trabajador no aparecerá
            en los flujos activos de entrega.
          </p>
        </div>
      </div>
    </Modal>
  )
}

// ─── Modal importar Excel trabajadores ───────────────────────────────────────

function ModalImportarTrabajadores({ cargos, sedes, empresas, onImportados, onClose }) {
  const [resultado,    setResultado]    = useState(null)
  const [cargando,     setCargando]     = useState(false)
  const [guardando,    setGuardando]    = useState(false)
  const [error,        setError]        = useState('')
  const [errorGuardar, setErrorGuardar] = useState('')
  const fileRef = useRef()

  const procesarArchivo = async (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return
    setCargando(true)
    setError('')
    try {
      const res = await parsearTrabajadores(archivo, { cargos, sedes, empresas })
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
    setErrorGuardar('')
    try {
      let creados = 0, actualizados = 0
      for (const t of resultado.trabajadores) {
        // Extraer solo los campos del DB (eliminar los campos de vista previa _*)
        const { _cargoNombre, _empresaNombre, _sedeNombre, ...trabajadorData } = t
        try {
          const existente = await trabajadorDB.getByCedula(trabajadorData.cedula)
          if (existente) {
            await trabajadorDB.update(existente.id, {
              nombres:   trabajadorData.nombres,
              apellidos: trabajadorData.apellidos,
              cargoId:   trabajadorData.cargoId,
              sedeId:    trabajadorData.sedeId,
              empresaId: trabajadorData.empresaId,
              estado:    'ACTIVO',
            })
            actualizados++
          } else {
            await trabajadorDB.create(trabajadorData)
            creados++
          }
        } catch (err) {
          const isDuplicate = err.message?.toLowerCase().includes('cedula')
            || err.message?.toLowerCase().includes('duplicate')
            || err.message?.toLowerCase().includes('unique')
          if (!isDuplicate) {
            setErrorGuardar(`Error al guardar cédula ${trabajadorData.cedula}: ${err.message}`)
            return
          }
        }
      }
      onImportados({ creados, actualizados })
    } catch (err) {
      setErrorGuardar(`Error inesperado: ${err.message}`)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Importar trabajadores desde Excel" size="lg"
           footer={
             <>
               <Button variant="secondary" onClick={onClose} disabled={guardando}>Cancelar</Button>
               {resultado?.trabajadores?.length > 0 && (
                 <Button onClick={confirmarImportacion} loading={guardando}>
                   Importar {resultado.trabajadores.length} trabajador(es)
                 </Button>
               )}
             </>
           }>
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">
          <p className="font-semibold mb-1">Columnas esperadas (tolerantes al orden):</p>
          <p>Cédula · Nombres · Apellidos · Cargo · Empresa (NIT o nombre) · Sede (opcional) · Fecha Ingreso (opcional)</p>
          <p className="mt-1 text-blue-600">Si el trabajador ya existe por cédula, se actualizará su empresa, cargo y sede.</p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={procesarArchivo} className="hidden" />
          <Button variant="secondary" iconLeft={Upload} onClick={() => fileRef.current?.click()} loading={cargando}>
            {cargando ? 'Procesando...' : 'Seleccionar archivo Excel'}
          </Button>
        </div>
        {error        && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}
        {errorGuardar && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{errorGuardar}</div>}
        {resultado && (
          <div className="space-y-3">
            {resultado.errores.map((e, i) => (
              <div key={i} className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">• {e}</div>
            ))}
            {resultado.advertencias.map((a, i) => (
              <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">• {a}</div>
            ))}
            {resultado.trabajadores.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 border-b">
                  {resultado.trabajadores.length} trabajador(es) a importar
                </div>
                <div className="max-h-52 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        {['Cédula','Nombre','Cargo','Empresa','Sede'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-slate-500 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.trabajadores.map((t, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0">
                          <td className="px-3 py-2 font-mono text-slate-600">{t.cedula}</td>
                          <td className="px-3 py-2 text-slate-800">{t.nombres} {t.apellidos}</td>
                          <td className="px-3 py-2 text-slate-500">{t._cargoNombre || '—'}</td>
                          <td className="px-3 py-2 text-slate-500">{t._empresaNombre || '—'}</td>
                          <td className="px-3 py-2 text-slate-500">{t._sedeNombre || 'Sin sede'}</td>
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
  const [trabajadores, setTrabajadores] = useState([])
  const [cargos,       setCargos]       = useState([])
  const [sedes,        setSedes]        = useState([])
  const [empresas,     setEmpresas]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [filtro,       setFiltro]       = useState('ACTIVO')
  const [toast,        setToast]        = useState('')

  const [modalTrab,   setModalTrab]  = useState(null)
  const [perfil,      setPerfil]     = useState(null)
  const [confirmar,   setConfirmar]  = useState(null)
  const [importar,    setImportar]   = useState(false)
  const [filtroCargo, setFiltroCargo] = useState(null)

  useEffect(() => { cargar() }, [])
  useEffect(() => { setFiltroCargo(null) }, [filtro])

  async function cargar() {
    setLoading(true)
    try {
      const [trabs, cgs, sds, emps] = await Promise.all([
        trabajadorDB.getAll(),
        cargoDB.getAll(),
        sedeDB.getAll(),
        empresaDB.getAll(),
      ])
      setTrabajadores(trabs  || [])
      setCargos(cgs          || [])
      setSedes(sds           || [])
      setEmpresas(emps       || [])
    } finally {
      setLoading(false)
    }
  }

  // Enriquecer trabajadores con nombres legibles
  const trabajadoresRich = useMemo(() => {
    const cargoMap   = Object.fromEntries(cargos.map(c => [c.id, c.nombre]))
    const sedeMap    = Object.fromEntries(sedes.map(s => [s.id, s.nombre]))
    const empresaMap = Object.fromEntries(empresas.map(e => [e.id, e.razonSocial]))
    return trabajadores.map(t => {
      const empresaNombre = empresaMap[t.empresaId] || '—'
      // Si no tiene sede, usar nombre de empresa como referencia visible
      const sedeNombre    = t.sedeId
        ? (sedeMap[t.sedeId]   || '—')
        : empresaNombre
      return {
        ...t,
        cargoNombre:   cargoMap[t.cargoId] || t.cargoNombre || '—',
        sedeNombre,
        empresaNombre,
      }
    })
  }, [trabajadores, cargos, sedes, empresas])

  const trabajadoresPorEstado = useMemo(() =>
    filtro === 'TODOS' ? trabajadoresRich : trabajadoresRich.filter(t => t.estado === filtro),
    [trabajadoresRich, filtro]
  )

  const trabajadoresFiltrados = useMemo(() =>
    filtroCargo ? trabajadoresPorEstado.filter(t => t.cargoId === filtroCargo) : trabajadoresPorEstado,
    [trabajadoresPorEstado, filtroCargo]
  )

  // Chips: un entry por cargo con conteo (base = filtro de estado, sin filtro de cargo)
  const chipsCargo = useMemo(() => {
    const conteo = {}
    trabajadoresPorEstado.forEach(t => {
      if (!t.cargoId) return
      if (!conteo[t.cargoId]) conteo[t.cargoId] = { id: t.cargoId, nombre: t.cargoNombre, count: 0 }
      conteo[t.cargoId].count++
    })
    return Object.values(conteo).sort((a, b) => b.count - a.count)
  }, [trabajadoresPorEstado])

  // Barra de contexto cuando hay cargo seleccionado
  const barraContexto = useMemo(() => {
    if (!filtroCargo) return null
    const enCargo = trabajadoresPorEstado.filter(t => t.cargoId === filtroCargo)
    const porEmpresa = {}
    enCargo.forEach(t => {
      const nombre = t.empresaNombre || '—'
      porEmpresa[nombre] = (porEmpresa[nombre] || 0) + 1
    })
    return {
      nombre: enCargo[0]?.cargoNombre || cargos.find(c => c.id === filtroCargo)?.nombre || '—',
      total:  enCargo.length,
      porEmpresa: Object.entries(porEmpresa).map(([nombre, count]) => ({ nombre, count })),
    }
  }, [filtroCargo, trabajadoresPorEstado, cargos])

  const countActivos   = trabajadores.filter(t => t.estado === 'ACTIVO').length
  const countInactivos = trabajadores.filter(t => t.estado === 'INACTIVO').length

  const guardar = async (data) => {
    setSaving(true)
    try {
      if (modalTrab?.id) {
        await trabajadorDB.update(modalTrab.id, data)
      } else {
        await trabajadorDB.create(data)
      }
      setModalTrab(null)
      await cargar()
    } catch (err) {
      alert(err.message?.includes('cedula')
        ? 'Ya existe un trabajador con esa cédula.'
        : `Error al guardar: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const desactivar = async () => {
    if (!confirmar) return
    setSaving(true)
    try {
      await trabajadorDB.remove(confirmar.id)
      setConfirmar(null)
      await cargar()
    } finally {
      setSaving(false)
    }
  }

  const mostrarToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const FILTROS = [
    { key: 'ACTIVO',   label: `Activos (${countActivos})`     },
    { key: 'INACTIVO', label: `Inactivos (${countInactivos})`  },
    { key: 'TODOS',    label: `Todos (${trabajadores.length})` },
  ]

  const columnas = useMemo(() => colsBase(), [])

  const cargoNombrePerfil = perfil ? cargos.find(c => c.id === perfil.cargoId)?.nombre || '—' : ''
  const sedeNombrePerfil  = perfil
    ? (sedes.find(s => s.id === perfil.sedeId)?.nombre || empresas.find(e => e.id === perfil.empresaId)?.razonSocial || '—')
    : ''

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users size={22} className="text-primary-700" strokeWidth={1.8} />
            Trabajadores
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {countActivos} trabajador{countActivos !== 1 ? 'es' : ''} activo{countActivos !== 1 ? 's' : ''} registrado{countActivos !== 1 ? 's' : ''}.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" iconLeft={Download} onClick={descargarFormatoTrabajadores}>
            Descargar formato
          </Button>
          <Button variant="secondary" iconLeft={Upload} onClick={() => setImportar(true)}>
            Importar Excel
          </Button>
          <Button iconLeft={Plus} onClick={() => setModalTrab({})}>
            Nuevo trabajador
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {FILTROS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            className={[
              'px-4 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
              filtro === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── Filtro por cargo ─────────────────────────────────────────────── */}
      {chipsCargo.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">

            {/* Dropdown */}
            <select
              value={filtroCargo ?? ''}
              onChange={e => setFiltroCargo(e.target.value ? Number(e.target.value) : null)}
              className="h-8 px-3 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
            >
              <option value="">Todos los cargos</option>
              {chipsCargo.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.count})</option>
              ))}
            </select>

            {/* Chips — visibles solo sin filtro activo */}
            {!filtroCargo && chipsCargo.map(chip => (
              <button
                key={chip.id}
                onClick={() => setFiltroCargo(chip.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                           border border-slate-200 bg-white text-slate-600
                           hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700
                           transition-colors"
              >
                {chip.nombre}
                <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                  {chip.count}
                </span>
              </button>
            ))}

            {/* Botón limpiar */}
            {filtroCargo && (
              <button
                onClick={() => setFiltroCargo(null)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs
                           text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <XIcon size={13} />
                Limpiar
              </button>
            )}
          </div>

          {/* Barra de contexto */}
          {barraContexto && (
            <div className="flex items-center gap-2 flex-wrap px-3 py-2 rounded-lg
                            bg-primary-50 border border-primary-100 text-xs">
              <span className="font-semibold text-primary-800">{barraContexto.nombre}</span>
              <span className="text-primary-400">—</span>
              <span className="font-medium text-primary-700">
                {barraContexto.total} trabajador{barraContexto.total !== 1 ? 'es' : ''}
              </span>
              {barraContexto.porEmpresa.map((e, i) => (
                <span key={i} className="text-primary-600">
                  <span className="text-primary-300 mx-1">·</span>
                  {e.nombre}: <strong className="text-primary-800">{e.count}</strong>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <Card noPadding>
        <DataTable
          columns={columnas}
          data={trabajadoresFiltrados}
          loading={loading}
          searchPlaceholder="Buscar por cédula, nombre, cargo…"
          emptyTitle={filtro === 'ACTIVO' ? 'Sin trabajadores activos' : 'Sin resultados'}
          emptyMessage={
            filtro === 'ACTIVO'
              ? 'Crea el primer trabajador o importa desde Excel.'
              : 'Cambia el filtro para ver otros trabajadores.'
          }
          onView={row => setPerfil(row)}
          onEdit={row => setModalTrab(row)}
          onDelete={row => setConfirmar(row)}
          className="p-4"
        />
      </Card>

      {modalTrab !== null && (
        <TrabajadorModal
          trabajador={modalTrab?.id ? modalTrab : null}
          cargos={cargos}
          sedes={sedes}
          empresas={empresas}
          onSave={guardar}
          onClose={() => setModalTrab(null)}
          saving={saving}
        />
      )}

      {perfil && (
        <TrabajadorPerfil
          trabajador={perfil}
          cargoNombre={cargoNombrePerfil}
          sedeNombre={sedeNombrePerfil}
          onClose={() => setPerfil(null)}
        />
      )}

      {confirmar && (
        <ModalConfirmar
          item={confirmar}
          onConfirm={desactivar}
          onClose={() => setConfirmar(null)}
          saving={saving}
        />
      )}

      {importar && (
        <ModalImportarTrabajadores
          cargos={cargos}
          sedes={sedes}
          empresas={empresas}
          onImportados={({ creados, actualizados }) => {
            setImportar(false)
            cargar()
            mostrarToast(`Importación: ${creados} creados, ${actualizados} actualizados.`)
          }}
          onClose={() => setImportar(false)}
        />
      )}
    </div>
  )
}
