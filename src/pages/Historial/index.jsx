import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { History, FileCheck2 }          from 'lucide-react'
import {
  entregaDB, trabajadorDB, cargoDB, sedeDB,
} from '@/db'
import { formatearFecha }               from '@/utils/dates'
import { formatearNumeroActa }          from '@/utils/formatters'
import { Badge, Button, Card, DataTable } from '@/components/ui'
import DetalleEntrega                   from './DetalleEntrega'

// ─── Columnas del DataTable ───────────────────────────────────────────────────
const COLUMNAS = [
  {
    key: 'id', label: 'Acta N°', sortable: true, width: 'w-36',
    render: (v, row) => (
      <span className="font-mono text-xs font-bold text-primary-800">
        {formatearNumeroActa(v, new Date(row.fechaEntrega).getFullYear())}
      </span>
    ),
  },
  {
    key: 'fechaEntrega', label: 'Fecha', sortable: true, width: 'w-28',
    render: v => (
      <span className="font-mono text-xs text-slate-500">{formatearFecha(v)}</span>
    ),
  },
  { key: 'trabajadorNombre', label: 'Trabajador',   sortable: true },
  {
    key: 'cedula', label: 'Cédula', sortable: true, width: 'w-28',
    render: v => <span className="font-mono text-xs text-slate-500">{v || '—'}</span>,
  },
  { key: 'cargoNombre',  label: 'Cargo', sortable: true },
  { key: 'sedeNombre',   label: 'Sede',  sortable: true, width: 'w-32' },
  {
    key: 'estado', label: 'Estado', align: 'center', width: 'w-28',
    render: v => (
      <Badge variant={v === 'FIRMADA' ? 'firmada' : v === 'PENDIENTE' ? 'pendiente' : 'danger'}>
        {v === 'FIRMADA' ? 'Firmada' : v === 'PENDIENTE' ? 'Pendiente' : 'Anulada'}
      </Badge>
    ),
  },
  {
    key: 'pdfGenerado', label: 'PDF', align: 'center', width: 'w-16',
    render: v => v
      ? <FileCheck2 size={14} className="text-green-600 mx-auto" />
      : <span className="text-slate-200 text-xs">—</span>,
  },
]

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Page() {
  const location = useLocation()
  const [entregas,     setEntregas]     = useState([])
  const [trabajadores, setTrabajadores] = useState([])
  const [cargos,       setCargos]       = useState([])
  const [sedes,        setSedes]        = useState([])
  const [loading,      setLoading]      = useState(true)

  const [filtroEstado, setFiltroEstado] = useState('TODOS')
  const [filtroSede,   setFiltroSede]   = useState('TODOS')
  const [filtroDesde,  setFiltroDesde]  = useState('')
  const [filtroHasta,  setFiltroHasta]  = useState('')

  const [detalle, setDetalle] = useState(null)  // entrega enriquecida

  // Volver a lista inicial al hacer clic en el módulo desde el sidebar
  useEffect(() => { setDetalle(null) }, [location.key])

  // ── Carga ─────────────────────────────────────────────────────────────────
  const cargar = async () => {
    setLoading(true)
    try {
      const [ents, trabs, cgs, sds] = await Promise.all([
        entregaDB.getAll(),
        trabajadorDB.getAll(),
        cargoDB.getAll(),
        sedeDB.getAll(),
      ])
      setEntregas(ents     || [])
      setTrabajadores(trabs || [])
      setCargos(cgs        || [])
      setSedes(sds         || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  // ── Enriquecimiento y filtrado ────────────────────────────────────────────
  const trabMap  = useMemo(() => Object.fromEntries(trabajadores.map(t => [t.id, t])), [trabajadores])
  const cargoMap = useMemo(() => Object.fromEntries(cargos.map(c => [c.id, c])),       [cargos])
  const sedeMap  = useMemo(() => Object.fromEntries(sedes.map(s => [s.id, s.nombre])), [sedes])

  const entregasRich = useMemo(() =>
    entregas.map(e => {
      const trab = trabMap[e.trabajadorId] || {}
      return {
        ...e,
        trabajadorNombre: `${trab.nombres || ''} ${trab.apellidos || ''}`.trim() || '—',
        cedula:           trab.cedula     || '—',
        cargoNombre:      cargoMap[e.cargoId]?.nombre || '—',
        sedeNombre:       sedeMap[e.sedeId]           || '—',
      }
    }),
    [entregas, trabMap, cargoMap, sedeMap]
  )

  const filtradas = useMemo(() => {
    let r = entregasRich
    if (filtroEstado !== 'TODOS') r = r.filter(e => e.estado === filtroEstado)
    if (filtroSede   !== 'TODOS') r = r.filter(e => String(e.sedeId) === filtroSede)
    if (filtroDesde)              r = r.filter(e => e.fechaEntrega >= filtroDesde)
    if (filtroHasta)              r = r.filter(e => e.fechaEntrega <= filtroHasta + 'T23:59:59')
    return r
  }, [entregasRich, filtroEstado, filtroSede, filtroDesde, filtroHasta])

  // Contadores para pills de estado
  const counts = useMemo(() => ({
    TODOS:     entregasRich.length,
    FIRMADA:   entregasRich.filter(e => e.estado === 'FIRMADA').length,
    PENDIENTE: entregasRich.filter(e => e.estado === 'PENDIENTE').length,
    ANULADA:   entregasRich.filter(e => e.estado === 'ANULADA').length,
  }), [entregasRich])

  const tieneFiltros = filtroSede !== 'TODOS' || filtroDesde || filtroHasta
  const limpiar = () => { setFiltroSede('TODOS'); setFiltroDesde(''); setFiltroHasta('') }

  const SELECT_CLS = `h-9 px-2.5 rounded-lg border border-slate-300 text-sm bg-white
                      text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500`

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <History size={22} className="text-primary-700" strokeWidth={1.8} />
            Historial de Entregas
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {counts.FIRMADA} acta{counts.FIRMADA !== 1 ? 's' : ''} firmada{counts.FIRMADA !== 1 ? 's' : ''} ·{' '}
            {counts.ANULADA > 0 && `${counts.ANULADA} anulada${counts.ANULADA !== 1 ? 's' : ''} · `}
            {entregas.length} total.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">

        {/* Pills estado */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {['TODOS', 'FIRMADA', 'PENDIENTE', 'ANULADA'].map(estado => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={[
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                filtroEstado === estado
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800',
              ].join(' ')}
            >
              {estado === 'TODOS' ? `Todos (${counts.TODOS})` : `${estado === 'FIRMADA' ? 'Firmadas' : estado === 'PENDIENTE' ? 'Pendientes' : 'Anuladas'} (${counts[estado]})`}
            </button>
          ))}
        </div>

        {/* Sede */}
        <div>
          <select value={filtroSede} onChange={e => setFiltroSede(e.target.value)} className={SELECT_CLS}>
            <option value="TODOS">Todas las sedes</option>
            {sedes.map(s => <option key={s.id} value={String(s.id)}>{s.nombre}</option>)}
          </select>
        </div>

        {/* Rango de fechas */}
        <input
          type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)}
          title="Desde" className={SELECT_CLS}
        />
        <input
          type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)}
          title="Hasta" className={SELECT_CLS}
        />

        {tieneFiltros && (
          <Button variant="ghost" size="sm" onClick={limpiar}>Limpiar filtros</Button>
        )}
      </div>

      {/* Tabla */}
      <Card noPadding>
        <DataTable
          columns={COLUMNAS}
          data={filtradas}
          loading={loading}
          searchPlaceholder="Buscar acta, trabajador, cédula, cargo…"
          emptyTitle={filtradas.length === 0 ? 'Sin entregas' : 'Sin resultados'}
          emptyMessage={
            entregasRich.length === 0
              ? 'Registra la primera entrega desde el módulo Nueva Entrega.'
              : 'Cambia los filtros para ver otros registros.'
          }
          onView={row => setDetalle(row)}
          className="p-4"
        />
      </Card>

      {/* Modal de detalle */}
      {detalle && (
        <DetalleEntrega
          entrega={detalle}
          onClose={() => setDetalle(null)}
          onAnulada={() => { setDetalle(null); cargar() }}
        />
      )}

    </div>
  )
}
