import { useState, useEffect, useMemo } from 'react'
import { Plus, Package }                from 'lucide-react'
import { inventarioDB, eppDB, sedeDB, empresaDB } from '@/db'
import { ESTADO_STOCK, ESTADO_STOCK_LABEL, TIPO_MOVIMIENTO } from '@/constants'
import { formatearFecha }               from '@/utils/dates'
import { Badge, Button, Card, DataTable, StatsCard } from '@/components/ui'
import MovimientoModal                  from './MovimientoModal'
import KardexModal                      from './KardexModal'

// ─── Semáforo de stock visual ─────────────────────────────────────────────────

function StockNum({ valor, estado }) {
  const cls = {
    [ESTADO_STOCK.OK]:      'text-green-700',
    [ESTADO_STOCK.BAJO]:    'text-amber-700',
    [ESTADO_STOCK.AGOTADO]: 'text-red-700',
  }
  return (
    <span className={['text-lg font-black tabular-nums', cls[estado] || ''].join(' ')}>
      {valor}
    </span>
  )
}

// ─── Columnas DataTable ───────────────────────────────────────────────────────

const COLUMNAS = [
  {
    key: 'eppItem', label: '#', sortable: true, width: 'w-12', align: 'center',
    render: v => (
      <span className="w-7 h-7 rounded-md bg-slate-700 text-white text-[10px] font-bold
                       inline-flex items-center justify-center">
        {String(v).padStart(2, '0')}
      </span>
    ),
  },
  { key: 'eppNombre',  label: 'EPP',  sortable: true },
  { key: 'sedeNombre', label: 'Sede', sortable: true, width: 'w-36' },
  {
    key: 'stockActual', label: 'Stock actual', sortable: true, align: 'center', width: 'w-28',
    render: (v, row) => <StockNum valor={v} estado={row.estadoStock} />,
  },
  {
    key: 'stockMinimo', label: 'Mín.', sortable: true, align: 'center', width: 'w-16',
    render: v => <span className="text-slate-500 tabular-nums">{v ?? 5}</span>,
  },
  {
    key: 'estadoStock', label: 'Estado', sortable: true, align: 'center', width: 'w-28',
    render: v => (
      <Badge variant={v === ESTADO_STOCK.OK ? 'success' : v === ESTADO_STOCK.BAJO ? 'warning' : 'danger'}>
        {ESTADO_STOCK_LABEL[v] ?? v}
      </Badge>
    ),
  },
  {
    key: 'unidadMedida', label: 'Unidad', sortable: true, width: 'w-20',
    render: v => <span className="text-slate-400 text-xs">{v || 'Unidad'}</span>,
  },
  {
    key: 'fechaUltimaActualizacion', label: 'Actualizado', sortable: true, width: 'w-28',
    render: v => <span className="font-mono text-xs text-slate-400">{formatearFecha(v)}</span>,
  },
]

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Page() {
  const [inventario, setInventario] = useState([])
  const [epps,       setEpps]       = useState([])
  const [sedes,      setSedes]      = useState([])
  const [empresas,   setEmpresas]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)

  const [filtroSede,   setFiltroSede]   = useState('TODOS')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')

  const [modalMov,    setModalMov]    = useState(null) // null | { registro, eppNombre, sedeNombre }
  const [modalKardex, setModalKardex] = useState(null) // null | { registro, eppNombre, sedeNombre }

  // ── Carga ─────────────────────────────────────────────────────────────────
  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const [inv, eps, sds, emps] = await Promise.all([
        inventarioDB.getAll(),
        eppDB.getAll(),
        sedeDB.getAll(),
        empresaDB.getAll(),
      ])
      setInventario(inv  || [])
      setEpps(eps        || [])
      setSedes(sds       || [])
      setEmpresas(emps   || [])
    } finally {
      setLoading(false)
    }
  }

  // Enriquecer con nombres y estado semáforo
  const invRich = useMemo(() => {
    const eppMap  = Object.fromEntries(epps.map(e  => [e.id,  e ]))
    const sedeMap = Object.fromEntries(sedes.map(s => [s.id,  s ]))
    return inventario.map(inv => ({
      ...inv,
      eppNombre:   eppMap[inv.eppId]?.nombre || '—',
      eppItem:     eppMap[inv.eppId]?.item   || 0,
      sedeNombre:  sedeMap[inv.sedeId]?.nombre || '—',
      estadoStock: inventarioDB.getEstadoStock(inv),
    }))
  }, [inventario, epps, sedes])

  const invFiltrado = useMemo(() => {
    let base = invRich
    if (filtroSede   !== 'TODOS') base = base.filter(i => String(i.sedeId) === filtroSede)
    if (filtroEstado !== 'TODOS') base = base.filter(i => i.estadoStock === filtroEstado)
    return base
  }, [invRich, filtroSede, filtroEstado])

  // Estadísticas
  const stats = useMemo(() => ({
    total:   invRich.length,
    ok:      invRich.filter(i => i.estadoStock === ESTADO_STOCK.OK).length,
    bajo:    invRich.filter(i => i.estadoStock === ESTADO_STOCK.BAJO).length,
    agotado: invRich.filter(i => i.estadoStock === ESTADO_STOCK.AGOTADO).length,
  }), [invRich])

  // ── Guardar movimiento ────────────────────────────────────────────────────
  const registrarMovimiento = async ({ eppId, sedeId, delta, tipo, meta }) => {
    setSaving(true)
    try {
      await inventarioDB.ajustarStock(eppId, sedeId, delta, tipo, meta)
      setModalMov(null)
      await cargar()
    } finally {
      setSaving(false)
    }
  }

  // ── Helpers para abrir modales desde la tabla ─────────────────────────────
  const abrirMovimiento = row => setModalMov({
    registro:  row,
    eppNombre: row.eppNombre,
    sedeNombre: row.sedeNombre,
  })

  const abrirKardex = row => setModalKardex({
    registro:  row,
    eppNombre: row.eppNombre,
    sedeNombre: row.sedeNombre,
  })

  // ── Render ────────────────────────────────────────────────────────────────
  const FILTROS_ESTADO = [
    { key: 'TODOS',                   label: `Todos (${stats.total})`    },
    { key: ESTADO_STOCK.OK,           label: `OK (${stats.ok})`          },
    { key: ESTADO_STOCK.BAJO,         label: `Bajo stock (${stats.bajo})` },
    { key: ESTADO_STOCK.AGOTADO,      label: `Agotado (${stats.agotado})`},
  ]

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package size={22} className="text-primary-700" strokeWidth={1.8} />
            Inventario de EPP
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Control de stock por EPP y sede.
          </p>
        </div>
        <Button iconLeft={Plus} onClick={() => setModalMov({ registro: null, eppNombre: '', sedeNombre: '' })}>
          Registrar entrada
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard label="Total ítems"   value={stats.total}   color="primary" />
        <StatsCard label="En stock OK"   value={stats.ok}      color="green"   />
        <StatsCard label="Bajo stock"    value={stats.bajo}    color="yellow"  />
        <StatsCard label="Agotados"      value={stats.agotado} color="red"     />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filtro por sede */}
        <select
          value={filtroSede}
          onChange={e => setFiltroSede(e.target.value)}
          className="h-9 px-3 rounded-lg border border-slate-300 text-sm bg-white text-slate-700
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="TODOS">Todas las sedes</option>
          {sedes.map(s => <option key={s.id} value={String(s.id)}>{s.nombre}</option>)}
        </select>

        {/* Filtro por estado */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {FILTROS_ESTADO.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFiltroEstado(key)}
              className={[
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                filtroEstado === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de inventario */}
      <Card noPadding>
        <DataTable
          columns={COLUMNAS}
          data={invFiltrado}
          loading={loading}
          searchPlaceholder="Buscar por EPP, sede…"
          emptyTitle="Sin registros de inventario"
          emptyMessage={
            filtroEstado !== 'TODOS'
              ? 'No hay ítems con ese estado. Cambia el filtro.'
              : 'Registra la primera entrada de EPP o importa la Matriz MT-SST-005.'
          }
          onView={row  => abrirKardex(row)}
          onEdit={row  => abrirMovimiento(row)}
          className="p-4"
        />
      </Card>

      {/* Modal movimiento */}
      {modalMov !== null && (
        <MovimientoModal
          registro={modalMov.registro}
          eppNombre={modalMov.eppNombre}
          sedeNombre={modalMov.sedeNombre}
          epps={epps.filter(e => e.estado === 'ACTIVO')}
          sedes={sedes.filter(s => s.estado === 'ACTIVO')}
          empresas={empresas}
          onSave={registrarMovimiento}
          onClose={() => setModalMov(null)}
          saving={saving}
        />
      )}

      {/* Modal kardex */}
      {modalKardex !== null && (
        <KardexModal
          registro={modalKardex.registro}
          eppNombre={modalKardex.eppNombre}
          sedeNombre={modalKardex.sedeNombre}
          onClose={() => setModalKardex(null)}
        />
      )}

    </div>
  )
}
