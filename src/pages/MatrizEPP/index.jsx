import { useState, useEffect, useMemo } from 'react'
import { LayoutGrid, List, Plus, AlertTriangle, Search } from 'lucide-react'
import { eppDB }                          from '@/db'
import { Badge, Button, Card, DataTable, Modal } from '@/components/ui'
import EppModal   from './EppModal'
import EppFicha   from './EppFicha'
import { vidaUtilLabel, vidaUtilVariant, itemColorClass } from './utils'

// ─── Columnas para vista de tabla ─────────────────────────────────────────────

const COLUMNAS = [
  {
    key: 'item', label: '#', sortable: true, width: 'w-16', align: 'center',
    render: (v, row) => (
      <span className={[
        'inline-flex items-center justify-center w-8 h-8 rounded-lg text-white text-xs font-bold',
        itemColorClass(v),
      ].join(' ')}>
        {String(v).padStart(2, '0')}
      </span>
    ),
  },
  { key: 'nombre',         label: 'Nombre EPP',      sortable: true },
  { key: 'partesCuerpo',   label: 'Parte del cuerpo', sortable: true },
  { key: 'normaAplicable', label: 'Norma',            sortable: true },
  {
    key: 'vidaUtilDias', label: 'Vida útil', sortable: true, width: 'w-32',
    render: (v) => (
      <Badge variant={vidaUtilVariant(v)}>{vidaUtilLabel(v)}</Badge>
    ),
  },
  {
    key: 'estado', label: 'Estado', align: 'center', width: 'w-24',
    render: (v) => (
      <Badge variant={v === 'ACTIVO' ? 'success' : 'neutral'}>
        {v === 'ACTIVO' ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
]

// ─── Tarjeta EPP (vista de cards) ────────────────────────────────────────────

function EppCard({ epp, onClick, onEdit }) {
  return (
    <div
      onClick={() => onClick(epp)}
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md
                 hover:border-primary-200 transition-all duration-150 cursor-pointer
                 flex flex-col overflow-hidden group"
    >
      {/* Header coloreado con número */}
      <div className={['flex items-center justify-between px-4 py-3', itemColorClass(epp.item)].join(' ')}>
        <span className="text-white text-2xl font-black tabular-nums">
          {String(epp.item).padStart(2, '0')}
        </span>
        <Badge variant={epp.estado === 'ACTIVO' ? 'success' : 'neutral'} size="sm">
          {epp.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      {/* Cuerpo */}
      <div className="flex-1 px-4 py-3 space-y-2">
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">
          {epp.nombre}
        </h3>
        {epp.partesCuerpo && (
          <p className="text-xs text-slate-500 truncate">{epp.partesCuerpo}</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 pt-1 flex items-center justify-between gap-2 border-t border-slate-100">
        <Badge variant={vidaUtilVariant(epp.vidaUtilDias)} size="sm">
          {vidaUtilLabel(epp.vidaUtilDias)}
        </Badge>
        {epp.normaAplicable && (
          <span className="text-[10px] text-slate-400 truncate max-w-[100px]" title={epp.normaAplicable}>
            {epp.normaAplicable}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Modal confirmar eliminación ──────────────────────────────────────────────

function ModalConfirmar({ epp, onConfirm, onClose, saving }) {
  return (
    <Modal open onClose={onClose} title="Eliminar EPP" size="sm"
           footer={
             <>
               <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
               <Button variant="danger" onClick={onConfirm} loading={saving}>Eliminar</Button>
             </>
           }>
      <div className="flex gap-3 items-start">
        <AlertTriangle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-800">
            ¿Eliminar EPP #{epp?.item}: {epp?.nombre}?
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Esta acción eliminará la ficha técnica. Los historiales de entrega no se verán afectados.
          </p>
        </div>
      </div>
    </Modal>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Page() {
  const [epps,    setEpps]    = useState([])
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [vista,   setVista]   = useState('tarjetas') // 'tarjetas' | 'tabla'
  const [buscar,  setBuscar]  = useState('')
  const [filtro,  setFiltro]  = useState('ACTIVO')

  const [modal,    setModal]    = useState(null) // null | {} | epp (crear/editar)
  const [ficha,    setFicha]    = useState(null) // null | epp (ver)
  const [eliminar, setEliminar] = useState(null) // null | epp (confirmar)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const data = await eppDB.getAll()
      setEpps(data || [])
    } finally {
      setLoading(false)
    }
  }

  // Filtrado + búsqueda para vista de tarjetas
  const eppsFiltrados = useMemo(() => {
    let base = filtro === 'TODOS' ? epps : epps.filter(e => e.estado === filtro)
    if (buscar.trim()) {
      const q = buscar.toLowerCase()
      base = base.filter(e =>
        e.nombre?.toLowerCase().includes(q)      ||
        String(e.item).includes(q)               ||
        e.normaAplicable?.toLowerCase().includes(q) ||
        e.partesCuerpo?.toLowerCase().includes(q)
      )
    }
    return base
  }, [epps, filtro, buscar])

  // Contadores
  const countActivos   = epps.filter(e => e.estado === 'ACTIVO').length
  const countInactivos = epps.filter(e => e.estado === 'INACTIVO').length

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const guardar = async (data) => {
    setSaving(true)
    try {
      modal?.id
        ? await eppDB.update(modal.id, data)
        : await eppDB.create(data)
      setModal(null)
      await cargar()
    } finally {
      setSaving(false)
    }
  }

  const confirmarEliminar = async () => {
    if (!eliminar) return
    setSaving(true)
    try {
      await eppDB.remove(eliminar.id)
      setEliminar(null)
      await cargar()
    } finally {
      setSaving(false)
    }
  }

  const abrirEditar = (epp) => { setFicha(null); setModal(epp) }

  // ── Render ────────────────────────────────────────────────────────────────
  const FILTROS = [
    { key: 'ACTIVO',   label: `Activos (${countActivos})`     },
    { key: 'INACTIVO', label: `Inactivos (${countInactivos})`  },
    { key: 'TODOS',    label: `Todos (${epps.length})`         },
  ]

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Matriz Técnica de EPP</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Fichas técnicas de los {countActivos} EPP activos — MT-SST-005 Versión 007.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle de vista */}
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setVista('tarjetas')}
              className={[
                'p-1.5 rounded-md transition-colors',
                vista === 'tarjetas' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-700',
              ].join(' ')}
              title="Vista de tarjetas"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setVista('tabla')}
              className={[
                'p-1.5 rounded-md transition-colors',
                vista === 'tabla' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-700',
              ].join(' ')}
              title="Vista de tabla"
            >
              <List size={16} />
            </button>
          </div>
          <Button iconLeft={Plus} onClick={() => setModal({})}>
            Nueva ficha
          </Button>
        </div>
      </div>

      {/* Barra de controles */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filtro estado */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {FILTROS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFiltro(key)}
              className={[
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                filtro === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Búsqueda (solo en vista tarjetas; la tabla tiene la suya) */}
        {vista === 'tarjetas' && (
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={buscar}
              onChange={e => setBuscar(e.target.value)}
              placeholder="Buscar EPP…"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 text-sm
                         text-slate-900 placeholder:text-slate-400 bg-white
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}
      </div>

      {/* ── Vista: TARJETAS ── */}
      {vista === 'tarjetas' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-36 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : eppsFiltrados.length === 0 ? (
            <Card>
              <div className="py-12 text-center text-slate-400 text-sm">
                {buscar ? `Sin resultados para "${buscar}"` : 'Sin EPP registrados.'}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {eppsFiltrados.map(epp => (
                <EppCard
                  key={epp.id}
                  epp={epp}
                  onClick={setFicha}
                  onEdit={abrirEditar}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Vista: TABLA ── */}
      {vista === 'tabla' && (
        <Card noPadding>
          <DataTable
            columns={COLUMNAS}
            data={eppsFiltrados}
            loading={loading}
            searchPlaceholder="Buscar por nombre, norma, parte del cuerpo…"
            emptyTitle="Sin EPP registrados"
            emptyMessage="Crea la primera ficha técnica o importa la Matriz MT-SST-005 en Configuración."
            onView={row => setFicha(row)}
            onEdit={row => abrirEditar(row)}
            onDelete={row => setEliminar(row)}
            className="p-4"
          />
        </Card>
      )}

      {/* Modales */}
      {modal !== null && (
        <EppModal
          epp={modal?.id ? modal : null}
          onSave={guardar}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {ficha && (
        <EppFicha
          epp={ficha}
          onEdit={abrirEditar}
          onClose={() => setFicha(null)}
        />
      )}

      {eliminar && (
        <ModalConfirmar
          epp={eliminar}
          onConfirm={confirmarEliminar}
          onClose={() => setEliminar(null)}
          saving={saving}
        />
      )}

    </div>
  )
}
