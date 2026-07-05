import { useState, useEffect, useMemo } from 'react'
import { CheckSquare, Plus, Download, QrCode } from 'lucide-react'
import { checklistDB, vehiculoDB, empresaDB } from '@/db'
import { formatearFecha }                     from '@/utils/dates'
import { Badge, Button, Card, DataTable, Modal }             from '@/components/ui'
import ChecklistForm   from './ChecklistForm'
import ChecklistDetalle from './ChecklistDetalle'
import QrAccesoModal   from './QrAccesoModal'
import * as XLSX from 'xlsx'

// ─── Columnas tabla ───────────────────────────────────────────────────────────

const COLUMNAS = [
  {
    key: 'fecha', label: 'Fecha', sortable: true, width: 'w-28',
    render: v => <span className="font-mono text-xs text-slate-700">{formatearFecha(v)}</span>,
  },
  { key: 'vehiculoPlaca',     label: 'Placa',      sortable: true, width: 'w-24' },
  { key: 'conductorNombre',   label: 'Conductor',  sortable: true },
  { key: 'empresaNombre',     label: 'Empresa',    sortable: true },
  {
    key: 'totalOk', label: 'Ítems OK', sortable: true, align: 'center', width: 'w-24',
    render: (v, row) => (
      <span className="text-xs font-bold text-green-700">
        {v}/{row.totalItems}
      </span>
    ),
  },
  {
    key: 'tieneObservacion', label: 'Observaciones', align: 'center', width: 'w-28',
    render: v => v
      ? <Badge variant="warning" size="sm">Con obs.</Badge>
      : <Badge variant="neutral"  size="sm">Sin obs.</Badge>,
  },
  {
    key: 'tieneFoto', label: 'Foto', align: 'center', width: 'w-20',
    render: v => v
      ? <Badge variant="success" size="sm">Sí</Badge>
      : <Badge variant="danger"  size="sm">No</Badge>,
  },
]

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Page() {
  const [checklists, setChecklists] = useState([])
  const [vehiculos,  setVehiculos]  = useState([])
  const [empresas,   setEmpresas]   = useState([])
  const [loading,    setLoading]    = useState(true)

  const [vistaForm,    setVistaForm]    = useState(false)
  const [detalle,      setDetalle]      = useState(null)
  const [verQr,        setVerQr]        = useState(false)

  // Filtros
  const [filtroEmpresa, setFiltroEmpresa] = useState('')
  const [filtroDesde,   setFiltroDesde]   = useState('')
  const [filtroHasta,   setFiltroHasta]   = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const [chks, vehs, emps] = await Promise.all([
        checklistDB.getAll(),
        vehiculoDB.getAll(),
        empresaDB.getAll(),
      ])
      setChecklists(chks  || [])
      setVehiculos(vehs   || [])
      setEmpresas(emps    || [])
    } finally {
      setLoading(false)
    }
  }

  // Enriquecer con datos legibles
  const checklistsRich = useMemo(() => {
    const vehMap = Object.fromEntries((vehiculos || []).map(v => [v.id, v]))
    const empMap = Object.fromEntries((empresas  || []).map(e => [e.id, e.razonSocial]))
    return (checklists || []).map(c => {
      const veh    = vehMap[c.vehiculoId]
      const items  = c.items || []
      const totalOk = items.filter(i => i.estado === 'OK' || i.estado === 'BUENO').length
      return {
        ...c,
        vehiculoPlaca:   veh?.placa || '—',
        empresaNombre:   empMap[c.empresaId] || '—',
        totalItems:      items.length,
        totalOk,
        tieneObservacion: Boolean(c.observacionGeneral || items.some(i => i.observacion)),
        tieneFoto:       Boolean(c.fotoBase64),
      }
    })
  }, [checklists, vehiculos, empresas])

  const filtrados = useMemo(() => {
    return checklistsRich.filter(c => {
      if (filtroEmpresa && c.empresaId !== Number(filtroEmpresa)) return false
      if (filtroDesde   && c.fecha < filtroDesde) return false
      if (filtroHasta   && c.fecha > filtroHasta) return false
      return true
    })
  }, [checklistsRich, filtroEmpresa, filtroDesde, filtroHasta])

  const exportarExcel = () => {
    const datos = filtrados.map(c => ({
      'Fecha':           formatearFecha(c.fecha),
      'Empresa':         c.empresaNombre,
      'Placa':           c.vehiculoPlaca,
      'Conductor':       c.conductorNombre,
      'Cédula Conductor':c.conductorCedula,
      'Ítems OK':        `${c.totalOk}/${c.totalItems}`,
      'Observaciones':   c.observacionGeneral || '',
      'Foto adjunta':    c.tieneFoto ? 'Sí' : 'No',
    }))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(datos)
    ws['!cols'] = Array(8).fill({ wch: 22 })
    XLSX.utils.book_append_sheet(wb, ws, 'Checklist')
    XLSX.writeFile(wb, `CHECKLIST_PREOPERACIONAL_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  if (vistaForm) {
    return (
      <ChecklistForm
        vehiculos={vehiculos}
        empresas={empresas}
        onGuardado={() => { setVistaForm(false); cargar() }}
        onCancelar={() => setVistaForm(false)}
      />
    )
  }

  if (detalle) {
    return (
      <ChecklistDetalle
        checklist={detalle}
        vehiculos={vehiculos}
        empresas={empresas}
        onVolver={() => setDetalle(null)}
      />
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare size={22} className="text-primary-700" strokeWidth={1.8} />
            Checklist Preoperacional
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Inspección diaria de vehículos conforme SST.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" iconLeft={QrCode} onClick={() => setVerQr(true)}>
            QR de acceso
          </Button>
          <Button variant="secondary" iconLeft={Download} onClick={exportarExcel} disabled={filtrados.length === 0}>
            Exportar Excel
          </Button>
          <Button iconLeft={Plus} onClick={() => setVistaForm(true)}>
            Nuevo checklist
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Empresa</label>
          <select
            value={filtroEmpresa}
            onChange={e => setFiltroEmpresa(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-300 text-sm text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">Todas</option>
            {empresas.map(e => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Desde</label>
          <input
            type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-300 text-sm text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1">Hasta</label>
          <input
            type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-300 text-sm text-slate-800
                       focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          />
        </div>
        {(filtroEmpresa || filtroDesde || filtroHasta) && (
          <button
            onClick={() => { setFiltroEmpresa(''); setFiltroDesde(''); setFiltroHasta('') }}
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <Card noPadding>
        <DataTable
          columns={COLUMNAS}
          data={filtrados}
          loading={loading}
          searchPlaceholder="Buscar por conductor, placa, empresa…"
          emptyTitle="Sin registros"
          emptyMessage="Haz clic en 'Nuevo checklist' para registrar la primera inspección."
          onView={row => setDetalle(row)}
          className="p-4"
        />
      </Card>

      {verQr && <QrAccesoModal onClose={() => setVerQr(false)} />}
    </div>
  )
}
