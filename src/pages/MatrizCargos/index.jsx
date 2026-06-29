import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, Search, Check, AlertTriangle, Pencil, Trash2 } from 'lucide-react'
import { cargoDB, eppDB, asignacionDB }         from '@/db'
import { Badge, Button, Modal }                 from '@/components/ui'
import CargoModal                               from './CargoModal'

// ─── Celda toggle (optimista) ─────────────────────────────────────────────────

function CeldaToggle({ activa, enFlight, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={enFlight}
      title={activa ? 'Asignado — clic para quitar' : 'No asignado — clic para agregar'}
      className={[
        'w-8 h-8 rounded-md flex items-center justify-center transition-all select-none',
        activa
          ? 'bg-primary-700 hover:bg-primary-800 text-white shadow-sm'
          : 'bg-slate-100 hover:bg-slate-200 text-slate-300',
        enFlight ? 'opacity-40 cursor-wait' : 'cursor-pointer',
      ].join(' ')}
    >
      {activa
        ? <Check size={13} strokeWidth={2.5} />
        : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 block" />}
    </button>
  )
}

// ─── Modal confirmar eliminación de cargo ─────────────────────────────────────

function ModalConfirmarCargo({ cargo, onConfirm, onClose, saving }) {
  return (
    <Modal open onClose={onClose} title="Eliminar cargo" size="sm"
           footer={
             <>
               <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
               <Button variant="danger" onClick={onConfirm} loading={saving}>Eliminar</Button>
             </>
           }>
      <div className="flex gap-3 items-start">
        <AlertTriangle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800">{cargo?.nombre}</p>
          <p className="text-xs text-slate-500">
            Se eliminarán también todas sus asignaciones de EPP.
            Los trabajadores con este cargo no serán eliminados.
          </p>
        </div>
      </div>
    </Modal>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Page() {
  const [cargos,      setCargos]      = useState([])
  const [epps,        setEpps]        = useState([])
  const [asignadas,   setAsignadas]   = useState(new Set())  // Set<"cargoId-eppId">
  const [enFlight,    setEnFlight]    = useState(new Set())  // Set<"cargoId-eppId"> en tránsito
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [buscar,      setBuscar]      = useState('')
  const [modalCargo,  setModalCargo]  = useState(null)
  const [confirmar,   setConfirmar]   = useState(null)

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const [cgs, eps, asigs] = await Promise.all([
        cargoDB.getAll(),
        eppDB.getAll(),
        asignacionDB.getAll(),
      ])
      setCargos(cgs  || [])
      setEpps(eps    || [])

      // Construir Set de asignaciones activas
      const activas = new Set(
        (asigs || [])
          .filter(a => a.vigente !== false)
          .map(a => `${a.cargoId}-${a.eppId}`)
      )
      setAsignadas(activas)
    } finally {
      setLoading(false)
    }
  }

  // ── Toggle optimista ──────────────────────────────────────────────────────
  const handleToggle = useCallback(async (cargoId, eppId) => {
    const key = `${cargoId}-${eppId}`
    if (enFlight.has(key)) return

    const eraActiva = asignadas.has(key)

    // Marcar en tránsito
    setEnFlight(prev => new Set([...prev, key]))

    // Actualización optimista local
    setAsignadas(prev => {
      const next = new Set(prev)
      eraActiva ? next.delete(key) : next.add(key)
      return next
    })

    try {
      await asignacionDB.toggle(cargoId, eppId)
    } catch {
      // Revertir si falla
      setAsignadas(prev => {
        const next = new Set(prev)
        eraActiva ? next.add(key) : next.delete(key)
        return next
      })
    } finally {
      setEnFlight(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }, [asignadas, enFlight])

  // ── CRUD Cargo ────────────────────────────────────────────────────────────
  const guardarCargo = async (data) => {
    setSaving(true)
    try {
      modalCargo?.id
        ? await cargoDB.update(modalCargo.id, data)
        : await cargoDB.create(data)
      setModalCargo(null)
      await cargar()
    } catch (err) {
      alert(err.message?.includes('nombre')
        ? 'Ya existe un cargo con ese nombre.'
        : `Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const eliminarCargo = async () => {
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

  // ── Datos derivados ───────────────────────────────────────────────────────
  const cargosFiltrados = useMemo(() => {
    if (!buscar.trim()) return cargos
    const q = buscar.toLowerCase()
    return cargos.filter(c => c.nombre.toLowerCase().includes(q))
  }, [cargos, buscar])

  const eppsActivos = useMemo(() => epps.filter(e => e.estado === 'ACTIVO'), [epps])

  // Totales por fila y columna
  const totalPorCargo = useCallback((cargoId) =>
    eppsActivos.filter(e => asignadas.has(`${cargoId}-${e.id}`)).length,
  [eppsActivos, asignadas])

  const totalPorEpp = useCallback((eppId) =>
    cargos.filter(c => asignadas.has(`${c.id}-${eppId}`)).length,
  [cargos, asignadas])

  const totalAsignaciones = useMemo(
    () => [...asignadas].filter(k => {
      const [cid, eid] = k.split('-').map(Number)
      return cargos.some(c => c.id === cid) && eppsActivos.some(e => e.id === eid)
    }).length,
    [asignadas, cargos, eppsActivos]
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Matriz por Cargos</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Asignación de EPP según cargo — MT-SST-005 Versión 007.
          </p>
        </div>
        <Button iconLeft={Plus} onClick={() => setModalCargo({})}>
          Nuevo cargo
        </Button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { label: 'Cargos', val: cargos.length,         cls: 'bg-slate-100 text-slate-700' },
          { label: 'EPP activos', val: eppsActivos.length, cls: 'bg-blue-50 text-blue-800'   },
          { label: 'Asignaciones', val: totalAsignaciones, cls: 'bg-green-50 text-green-800' },
        ].map(({ label, val, cls }) => (
          <div key={label} className={['flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium', cls].join(' ')}>
            <span className="text-base font-bold tabular-nums">{val}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Buscador de cargos */}
      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="search"
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
          placeholder="Filtrar cargos…"
          className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 text-sm
                     text-slate-900 placeholder:text-slate-400 bg-white
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* ── Matriz ── */}
      {loading ? (
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
      ) : cargos.length === 0 || eppsActivos.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          {cargos.length === 0
            ? 'No hay cargos registrados. Crea el primer cargo o importa la Matriz MT-SST-005.'
            : 'No hay EPP activos. Ve a Matriz Técnica de EPP para activar fichas.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div
            className="overflow-auto"
            style={{ maxHeight: 'calc(100vh - 340px)' }}
          >
            <table className="border-collapse text-xs" style={{ tableLayout: 'fixed' }}>

              {/* ─── Encabezado EPP ─────────────────────────────────── */}
              <thead>
                <tr>
                  {/* Esquina sticky */}
                  <th
                    className="sticky left-0 top-0 z-30 bg-slate-50 border-b border-r border-slate-200
                               px-3 py-3 text-left min-w-[200px] font-semibold text-slate-600 uppercase tracking-wide text-[10px]"
                  >
                    Cargo
                  </th>

                  {/* Columnas EPP — número + nombre abreviado */}
                  {eppsActivos.map(epp => (
                    <th
                      key={epp.id}
                      title={epp.nombre}
                      className="sticky top-0 z-20 bg-slate-50 border-b border-r border-slate-200
                                 px-1 py-2 text-center font-bold text-slate-700 cursor-default"
                      style={{ width: 58, minWidth: 58 }}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span
                          className="w-7 h-7 rounded-md bg-slate-700 text-white flex items-center
                                     justify-center text-[10px] font-black"
                        >
                          {String(epp.item).padStart(2, '0')}
                        </span>
                        <span
                          className="text-[9px] text-slate-500 leading-tight text-center w-14 truncate"
                          title={epp.nombre}
                        >
                          {epp.nombre.split(' ').slice(0, 2).join(' ')}
                        </span>
                      </div>
                    </th>
                  ))}

                  {/* Columna total */}
                  <th
                    className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200
                               px-3 py-3 text-center font-semibold text-slate-600 text-[10px] uppercase tracking-wide"
                    style={{ minWidth: 60 }}
                  >
                    Total
                  </th>
                </tr>
              </thead>

              {/* ─── Filas de cargos ────────────────────────────────── */}
              <tbody>
                {cargosFiltrados.map((cargo, rowIdx) => {
                  const total = totalPorCargo(cargo.id)
                  return (
                    <tr
                      key={cargo.id}
                      className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                    >
                      {/* Nombre del cargo (sticky) */}
                      <td
                        className="sticky left-0 z-10 border-r border-slate-200 px-3 py-1.5
                                   font-medium text-slate-800 bg-inherit"
                        style={{ minWidth: 200 }}
                      >
                        <div className="flex items-center justify-between gap-2 group">
                          <span className="truncate max-w-[148px]" title={cargo.nombre}>
                            {cargo.nombre}
                          </span>
                          {/* Acciones (visibles en hover) */}
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={() => setModalCargo(cargo)}
                              title="Editar cargo"
                              className="p-1 rounded text-slate-400 hover:text-primary-700 hover:bg-primary-50"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={() => setConfirmar(cargo)}
                              title="Eliminar cargo"
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Celdas de toggle */}
                      {eppsActivos.map(epp => {
                        const key    = `${cargo.id}-${epp.id}`
                        const activa = asignadas.has(key)
                        const fly    = enFlight.has(key)
                        return (
                          <td
                            key={epp.id}
                            className="border-r border-slate-100 p-1 text-center"
                          >
                            <CeldaToggle
                              activa={activa}
                              enFlight={fly}
                              onClick={() => handleToggle(cargo.id, epp.id)}
                            />
                          </td>
                        )
                      })}

                      {/* Total por cargo */}
                      <td className="px-3 py-1.5 text-center">
                        <Badge variant={total > 0 ? 'primary' : 'neutral'} size="sm">
                          {total}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}

                {/* ── Fila de totales por EPP ── */}
                <tr className="bg-slate-100 border-t border-slate-300 font-semibold">
                  <td className="sticky left-0 z-10 bg-slate-100 border-r border-slate-200 px-3 py-2 text-[10px] uppercase tracking-wide text-slate-500">
                    Total por EPP
                  </td>
                  {eppsActivos.map(epp => (
                    <td key={epp.id} className="border-r border-slate-200 px-1 py-1.5 text-center">
                      <span className="text-[10px] font-bold text-slate-600 tabular-nums">
                        {totalPorEpp(epp.id)}
                      </span>
                    </td>
                  ))}
                  <td className="px-3 py-1.5 text-center">
                    <span className="text-[10px] font-bold text-primary-800 tabular-nums">
                      {totalAsignaciones}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Leyenda inferior */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-4 h-4 rounded-md bg-primary-700 flex items-center justify-center">
                <Check size={10} className="text-white" strokeWidth={3} />
              </div>
              EPP asignado al cargo
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-4 h-4 rounded-md bg-slate-100 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-slate-300 block" />
              </div>
              Sin asignación
            </div>
            <p className="text-xs text-slate-400 ml-auto">
              Hover sobre el número de EPP para ver el nombre
            </p>
          </div>
        </div>
      )}

      {/* Modales */}
      {modalCargo !== null && (
        <CargoModal
          cargo={modalCargo?.id ? modalCargo : null}
          onSave={guardarCargo}
          onClose={() => setModalCargo(null)}
          saving={saving}
        />
      )}

      {confirmar && (
        <ModalConfirmarCargo
          cargo={confirmar}
          onConfirm={eliminarCargo}
          onClose={() => setConfirmar(null)}
          saving={saving}
        />
      )}

    </div>
  )
}
