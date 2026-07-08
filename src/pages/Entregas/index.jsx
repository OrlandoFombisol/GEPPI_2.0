import { useState, useEffect, useMemo } from 'react'
import { Plus, ClipboardList }          from 'lucide-react'
import { useLocation }                  from 'react-router-dom'
import { entregaDB, trabajadorDB, sedeDB } from '@/db'
import { formatearFecha }                  from '@/utils/dates'
import { formatearNumeroActa }             from '@/utils/formatters'
import { Badge, Button, Card, DataTable }  from '@/components/ui'
import NuevaEntrega                        from './NuevaEntrega'

// ─── Columnas del historial rápido ────────────────────────────────────────────

const COLUMNAS = [
  {
    key: 'id', label: 'Acta', sortable: true, width: 'w-36',
    render: (v, row) => (
      <span className="font-mono text-xs font-bold text-primary-800">
        {formatearNumeroActa(v, new Date(row.fechaEntrega).getFullYear())}
      </span>
    ),
  },
  { key: 'trabajadorNombre', label: 'Trabajador',    sortable: true },
  { key: 'sedeNombre',       label: 'Sede',           sortable: true, width: 'w-32' },
  {
    key: 'fechaEntrega', label: 'Fecha', sortable: true, width: 'w-28',
    render: v => <span className="font-mono text-xs text-slate-500">{formatearFecha(v)}</span>,
  },
  {
    key: 'estado', label: 'Estado', align: 'center', width: 'w-28',
    render: v => (
      <Badge variant={v === 'FIRMADA' ? 'firmada' : v === 'PENDIENTE' ? 'pendiente' : 'anulada'}>
        {v === 'FIRMADA' ? 'Firmada' : v === 'PENDIENTE' ? 'Pendiente' : 'Anulada'}
      </Badge>
    ),
  },
]

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Page() {
  const location = useLocation()
  // Arrancar en 'nueva' si la URL termina en /nueva
  const [vista, setVista] = useState(
    location.pathname.endsWith('/nueva') ? 'nueva' : 'lista'
  )
  const [entregas,   setEntregas]   = useState([])
  const [trabajadores, setTrabajadores] = useState([])
  const [sedes,      setSedes]      = useState([])
  const [loading,    setLoading]    = useState(true)

  // Volver a lista inicial al hacer clic en el módulo desde el sidebar
  useEffect(() => {
    setVista(location.pathname.endsWith('/nueva') ? 'nueva' : 'lista')
  }, [location.key])

  useEffect(() => {
    if (vista === 'lista') cargar()
  }, [vista])

  async function cargar() {
    setLoading(true)
    try {
      const [ents, trabs, sds] = await Promise.all([
        entregaDB.getAll(),
        trabajadorDB.getAll(),
        sedeDB.getAll(),
      ])
      setEntregas(ents     || [])
      setTrabajadores(trabs || [])
      setSedes(sds         || [])
    } finally {
      setLoading(false)
    }
  }

  const entregasRich = useMemo(() => {
    const trabMap = Object.fromEntries(
      trabajadores.map(t => [t.id, `${t.nombres} ${t.apellidos}`])
    )
    const sedeMap = Object.fromEntries(sedes.map(s => [s.id, s.nombre]))
    return entregas.map(e => ({
      ...e,
      trabajadorNombre: trabMap[e.trabajadorId] || `#${e.trabajadorId}`,
      sedeNombre:       sedeMap[e.sedeId]       || '—',
    }))
  }, [entregas, trabajadores, sedes])

  const handleCompletado = () => setVista('lista')
  const handleCancelar   = () => setVista('lista')

  // ── Render ────────────────────────────────────────────────────────────────

  if (vista === 'nueva') {
    return (
      <div className="p-3 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Nueva Entrega de EPP</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Registro con firma digital · MT-SST-005 Versión 007
          </p>
        </div>
        <NuevaEntrega onCancelar={handleCancelar} onCompletado={handleCompletado} />
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList size={22} className="text-primary-700" strokeWidth={1.8} />
            Entregas de EPP
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {entregas.length} acta{entregas.length !== 1 ? 's' : ''} registrada{entregas.length !== 1 ? 's' : ''}.
          </p>
        </div>
        <Button iconLeft={Plus} onClick={() => setVista('nueva')}>
          Nueva entrega
        </Button>
      </div>

      {/* Historial reciente */}
      <Card noPadding>
        <DataTable
          columns={COLUMNAS}
          data={entregasRich}
          loading={loading}
          searchPlaceholder="Buscar acta, trabajador, sede…"
          emptyTitle="Sin entregas registradas"
          emptyMessage="Inicia el flujo de 'Nueva entrega' para registrar la primera acta."
          className="p-4"
        />
      </Card>

    </div>
  )
}
