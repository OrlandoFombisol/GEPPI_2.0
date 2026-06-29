import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle, RefreshCw, Download } from 'lucide-react'
import { detalleEntregaDB, entregaDB, trabajadorDB, cargoDB, eppDB, empresaDB, sedeDB } from '@/db'
import { DIAS_ALERTA }   from '@/constants'
import { formatearFecha } from '@/utils/dates'
import { Badge, Button, Card, DataTable } from '@/components/ui'
import * as XLSX from 'xlsx'

// ─── Estado según ciclo de vida ──────────────────────────────────────────────

function calcularEstado(fechaVencimiento) {
  if (!fechaVencimiento) return 'SIN_FECHA'
  const hoy    = new Date()
  const vence  = new Date(fechaVencimiento)
  const dias   = Math.ceil((vence - hoy) / 86400000)
  if (dias < 0)                    return 'VENCIDO'
  if (dias <= DIAS_ALERTA.CRITICO) return 'REQUIERE_REPOSICION'
  if (dias <= DIAS_ALERTA.ADVERTENCIA) return 'PROXIMO_VENCER'
  return 'VIGENTE'
}

const ESTADO_LABEL = {
  VIGENTE:             'Vigente',
  PROXIMO_VENCER:      'Próximo a vencer',
  REQUIERE_REPOSICION: 'Requiere reposición',
  VENCIDO:             'Vencido',
  SIN_FECHA:           'Sin fecha registrada',
}
const ESTADO_VARIANT = {
  VIGENTE:             'success',
  PROXIMO_VENCER:      'warning',
  REQUIERE_REPOSICION: 'danger',
  VENCIDO:             'danger',
  SIN_FECHA:           'neutral',
}

// ─── Columnas ────────────────────────────────────────────────────────────────

const COLUMNAS = [
  { key: 'trabajadorNombre', label: 'Trabajador', sortable: true },
  {
    key: 'cedula', label: 'Cédula', sortable: true, width: 'w-28',
    render: v => <span className="font-mono text-xs text-slate-600">{v}</span>,
  },
  { key: 'empresaNombre', label: 'Empresa',  sortable: true },
  { key: 'sedeNombre',    label: 'Sede',     sortable: true },
  { key: 'cargoNombre',   label: 'Cargo',    sortable: true },
  { key: 'eppNombre',     label: 'EPP',      sortable: true },
  {
    key: 'fechaEntrega', label: 'Entregado', sortable: true, width: 'w-28',
    render: v => <span className="font-mono text-xs text-slate-500">{formatearFecha(v)}</span>,
  },
  {
    key: 'fechaVencimiento', label: 'Vence', sortable: true, width: 'w-28',
    render: v => v
      ? <span className="font-mono text-xs text-slate-700">{formatearFecha(v)}</span>
      : <span className="text-slate-400 text-xs">—</span>,
  },
  {
    key: 'diasRestantes', label: 'Días', sortable: true, align: 'center', width: 'w-16',
    render: v => (
      <span className={['tabular-nums text-xs font-bold',
        v < 0 ? 'text-red-600' : v <= 7 ? 'text-orange-600' : v <= 30 ? 'text-yellow-600' : 'text-green-700'
      ].join(' ')}>
        {v != null ? v : '—'}
      </span>
    ),
  },
  {
    key: 'estado', label: 'Estado', sortable: true, align: 'center', width: 'w-36',
    render: v => (
      <Badge variant={ESTADO_VARIANT[v] || 'neutral'} size="sm">
        {ESTADO_LABEL[v] || v}
      </Badge>
    ),
  },
]

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Page() {
  const [filas,         setFilas]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [filtro,        setFiltro]        = useState('TODOS')
  const [filtroEmpresa, setFiltroEmpresa] = useState('TODOS')
  const [filtroSede,    setFiltroSede]    = useState('TODOS')
  const [empresasOpts,  setEmpresasOpts]  = useState([])
  const [sedesOpts,     setSedesOpts]     = useState([])

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const [detalles, entregas, trabajadores, cargos, epps, empresas, sedes] = await Promise.all([
        detalleEntregaDB.getProximosAVencer(9999), // traer todos
        entregaDB.getAll(),
        trabajadorDB.getAll(),
        cargoDB.getAll(),
        eppDB.getAll(),
        empresaDB.getAll(),
        sedeDB.getAll(),
      ])

      // Mapas rápidos
      const entregaMap    = Object.fromEntries((entregas || []).map(e => [e.id, e]))
      const trabMap       = Object.fromEntries((trabajadores || []).map(t => [t.id, t]))
      const cargoMap      = Object.fromEntries((cargos  || []).map(c => [c.id, c.nombre]))
      const eppMap        = Object.fromEntries((epps    || []).map(e => [e.id, e]))
      const empresaMap    = Object.fromEntries((empresas || []).map(e => [e.id, e.razonSocial]))
      const sedeMap       = Object.fromEntries((sedes   || []).map(s => [s.id, s.nombre]))

      const rows = []
      for (const d of (detalles || [])) {
        const entrega = entregaMap[d.entregaId]
        if (!entrega || entrega.estado === 'ANULADA') continue

        const trab    = trabMap[entrega.trabajadorId]
        if (!trab) continue

        const epp     = eppMap[d.eppId]
        const estado  = calcularEstado(d.fechaVencimiento)
        const diasRestantes = d.fechaVencimiento
          ? Math.ceil((new Date(d.fechaVencimiento) - new Date()) / 86400000)
          : null

        const empresaNombre = empresaMap[trab.empresaId] || empresaMap[entrega.empresaId] || '—'
        const sedeNombre    = trab.sedeId
          ? (sedeMap[trab.sedeId] || empresaNombre)
          : empresaNombre

        rows.push({
          id:               d.id,
          trabajadorNombre: `${trab.nombres} ${trab.apellidos}`,
          cedula:           trab.cedula,
          empresaNombre,
          sedeNombre,
          cargoNombre:      cargoMap[trab.cargoId] || cargoMap[entrega.cargoId] || '—',
          eppNombre:        epp?.nombre || `EPP #${d.eppId}`,
          fechaEntrega:     entrega.fechaEntrega,
          fechaVencimiento: d.fechaVencimiento,
          diasRestantes,
          estado,
          cantidad:         d.cantidad,
        })
      }

      rows.sort((a, b) => {
        if (a.diasRestantes == null) return 1
        if (b.diasRestantes == null) return -1
        return a.diasRestantes - b.diasRestantes
      })

      // Opciones de filtro dinámicas
      const empUniq = [...new Map(rows.filter(r => r.empresaNombre !== '—').map(r => [r.empresaNombre, r.empresaNombre])).values()]
      const sedUniq = [...new Map(rows.filter(r => r.sedeNombre !== '—').map(r => [r.sedeNombre, r.sedeNombre])).values()]
      setEmpresasOpts(empUniq.sort())
      setSedesOpts(sedUniq.sort())
      setFilas(rows)
    } finally {
      setLoading(false)
    }
  }

  const filasFiltradas = useMemo(() => {
    let r = filas
    if (filtro        !== 'TODOS') r = r.filter(f => f.estado       === filtro)
    if (filtroEmpresa !== 'TODOS') r = r.filter(f => f.empresaNombre === filtroEmpresa)
    if (filtroSede    !== 'TODOS') r = r.filter(f => f.sedeNombre    === filtroSede)
    return r
  }, [filas, filtro, filtroEmpresa, filtroSede])

  // Stats resumen
  const stats = useMemo(() => ({
    total:             filas.length,
    vigente:           filas.filter(f => f.estado === 'VIGENTE').length,
    proximoVencer:     filas.filter(f => f.estado === 'PROXIMO_VENCER').length,
    requiereReposicion:filas.filter(f => f.estado === 'REQUIERE_REPOSICION').length,
    vencido:           filas.filter(f => f.estado === 'VENCIDO').length,
  }), [filas])

  const exportarExcel = () => {
    const datos = filasFiltradas.map(f => ({
      'Trabajador':        f.trabajadorNombre,
      'Cédula':            f.cedula,
      'Empresa':           f.empresaNombre,
      'Sede':              f.sedeNombre,
      'Cargo':             f.cargoNombre,
      'EPP':               f.eppNombre,
      'Cantidad':          f.cantidad,
      'Fecha Entrega':     formatearFecha(f.fechaEntrega),
      'Fecha Vencimiento': f.fechaVencimiento ? formatearFecha(f.fechaVencimiento) : '—',
      'Días Restantes':    f.diasRestantes ?? '—',
      'Estado':            ESTADO_LABEL[f.estado] || f.estado,
    }))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(datos)
    ws['!cols'] = Array(11).fill({ wch: 22 })
    XLSX.utils.book_append_sheet(wb, ws, 'Consolidado EPP')
    XLSX.writeFile(wb, `CONSOLIDADO_EPP_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const FILTROS = [
    { key: 'TODOS',              label: `Todos (${stats.total})`,                        cls: 'text-slate-600' },
    { key: 'VIGENTE',            label: `Vigente (${stats.vigente})`,                   cls: 'text-green-700'  },
    { key: 'PROXIMO_VENCER',     label: `Próximo a vencer (${stats.proximoVencer})`,    cls: 'text-yellow-700' },
    { key: 'REQUIERE_REPOSICION',label: `Requiere reposición (${stats.requiereReposicion})`, cls: 'text-orange-700' },
    { key: 'VENCIDO',            label: `Vencido (${stats.vencido})`,                   cls: 'text-red-700'    },
  ]

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle size={22} className="text-amber-500" strokeWidth={1.8} />
            Consolidado — Ciclo de Vida EPP
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Estado de vigencia de todos los EPP entregados a trabajadores.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" iconLeft={RefreshCw} onClick={cargar} disabled={loading}>
            Actualizar
          </Button>
          <Button variant="secondary" iconLeft={Download} onClick={exportarExcel} disabled={filas.length === 0}>
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Resumen visual */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Vigentes',         val: stats.vigente,            bg: 'bg-green-50',  txt: 'text-green-800',  border: 'border-green-200' },
          { label: 'Próximos a vencer',val: stats.proximoVencer,      bg: 'bg-yellow-50', txt: 'text-yellow-800', border: 'border-yellow-200' },
          { label: 'Req. reposición',  val: stats.requiereReposicion, bg: 'bg-orange-50', txt: 'text-orange-800', border: 'border-orange-200' },
          { label: 'Vencidos',         val: stats.vencido,            bg: 'bg-red-50',    txt: 'text-red-800',    border: 'border-red-200' },
        ].map(({ label, val, bg, txt, border }) => (
          <div key={label} className={`${bg} ${border} border rounded-xl px-4 py-3`}>
            <p className={`text-3xl font-black tabular-nums ${txt}`}>{val}</p>
            <p className={`text-xs font-medium ${txt} mt-0.5`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Estado pills */}
        <div className="flex flex-wrap gap-1 bg-slate-100 rounded-lg p-1">
          {FILTROS.map(({ key, label, cls }) => (
            <button
              key={key}
              onClick={() => setFiltro(key)}
              className={[
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                filtro === key ? `bg-white shadow-sm ${cls}` : 'text-slate-500 hover:text-slate-800',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Empresa */}
        {empresasOpts.length > 1 && (
          <select value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="TODOS">Todas las empresas</option>
            {empresasOpts.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        )}

        {/* Sede */}
        {sedesOpts.length > 1 && (
          <select value={filtroSede} onChange={e => setFiltroSede(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="TODOS">Todas las sedes</option>
            {sedesOpts.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        {(filtroEmpresa !== 'TODOS' || filtroSede !== 'TODOS') && (
          <button onClick={() => { setFiltroEmpresa('TODOS'); setFiltroSede('TODOS') }}
            className="text-xs text-primary-600 hover:text-primary-800 font-medium">
            Limpiar
          </button>
        )}
        <span className="ml-auto text-xs text-slate-400">{filasFiltradas.length} registros</span>
      </div>

      {/* Tabla */}
      <Card noPadding>
        <DataTable
          columns={COLUMNAS}
          data={filasFiltradas}
          loading={loading}
          searchPlaceholder="Buscar por trabajador, EPP, empresa…"
          emptyTitle="Sin registros de EPP"
          emptyMessage="Cuando se registren entregas firmadas, aparecerán aquí con su estado de vigencia."
          className="p-4"
        />
      </Card>
    </div>
  )
}
