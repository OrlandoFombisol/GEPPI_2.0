import { useState, useEffect, useMemo } from 'react'
import { ShieldCheck, RefreshCw }        from 'lucide-react'
import { auditoriaDB }                   from '@/db'
import { MODULO, ACCION }                from '@/constants'
import { formatearFechaHora }            from '@/utils/dates'
import { Badge, Button, Card, DataTable } from '@/components/ui'

// ─── Mapas de etiquetas y variantes ──────────────────────────────────────────
const MODULO_LABEL = {
  [MODULO.DASHBOARD]:      'Dashboard',
  [MODULO.EMPRESAS]:       'Empresas',
  [MODULO.SEDES]:          'Sedes',
  [MODULO.TRABAJADORES]:   'Trabajadores',
  [MODULO.CARGOS]:         'Cargos',
  [MODULO.MATRIZ_EPP]:     'Matriz EPP',
  [MODULO.MATRIZ_CARGOS]:  'Matriz Cargos',
  [MODULO.INVENTARIO]:     'Inventario',
  [MODULO.ENTREGAS]:       'Entregas',
  [MODULO.HISTORIAL]:      'Historial',
  [MODULO.REPORTES]:       'Reportes',
  [MODULO.ALERTAS]:        'Alertas',
  [MODULO.GESTION_CAMBIO]: 'Gestión Cambio',
  [MODULO.AUDITORIA]:      'Auditoría',
  [MODULO.CONFIGURACION]:  'Configuración',
}

const ACCION_LABEL = {
  [ACCION.CREAR]:    'Crear',
  [ACCION.EDITAR]:   'Editar',
  [ACCION.ELIMINAR]: 'Eliminar',
  [ACCION.IMPORTAR]: 'Importar',
  [ACCION.EXPORTAR]: 'Exportar',
  [ACCION.FIRMAR]:   'Firmar',
  [ACCION.ANULAR]:   'Anular',
  [ACCION.LOGIN]:    'Inicio sesión',
  [ACCION.LOGOUT]:   'Cierre sesión',
}

const ACCION_VARIANT = {
  [ACCION.CREAR]:    'success',
  [ACCION.EDITAR]:   'info',
  [ACCION.ELIMINAR]: 'danger',
  [ACCION.IMPORTAR]: 'primary',
  [ACCION.EXPORTAR]: 'primary',
  [ACCION.FIRMAR]:   'success',
  [ACCION.ANULAR]:   'danger',
  [ACCION.LOGIN]:    'neutral',
  [ACCION.LOGOUT]:   'neutral',
}

// ─── Columnas DataTable ───────────────────────────────────────────────────────
const COLUMNAS = [
  {
    key: 'fecha', label: 'Fecha / Hora', sortable: true, width: 'w-36',
    render: v => (
      <span className="font-mono text-xs text-slate-500 whitespace-nowrap">
        {formatearFechaHora(v)}
      </span>
    ),
  },
  {
    key: 'modulo', label: 'Módulo', sortable: true, width: 'w-32',
    render: v => (
      <Badge variant="neutral" size="sm">{MODULO_LABEL[v] || v}</Badge>
    ),
  },
  {
    key: 'accion', label: 'Acción', sortable: true, width: 'w-28',
    render: v => (
      <Badge variant={ACCION_VARIANT[v] || 'neutral'} size="sm">
        {ACCION_LABEL[v] || v}
      </Badge>
    ),
  },
  {
    key: 'descripcion', label: 'Detalle', sortable: false,
    render: (v, row) => (
      <span className="text-slate-700 text-xs">
        {v || row.detalle || '—'}
      </span>
    ),
  },
  {
    key: 'referenciaId', label: 'Ref.', sortable: false, width: 'w-16',
    render: v => v
      ? <span className="font-mono text-xs text-slate-400">#{v}</span>
      : null,
  },
]

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Page() {
  const [registros, setRegistros] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filtroMod, setFiltroMod] = useState('')
  const [filtroAcc, setFiltroAcc] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')

  const cargar = async () => {
    setLoading(true)
    try {
      const data = await auditoriaDB.getAll()
      setRegistros(data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  // Filtrado cliente (ya cargamos todos en memoria)
  const filtrados = useMemo(() => {
    let r = registros
    if (filtroMod)   r = r.filter(x => x.modulo === filtroMod)
    if (filtroAcc)   r = r.filter(x => x.accion === filtroAcc)
    if (filtroDesde) r = r.filter(x => x.fecha >= filtroDesde)
    if (filtroHasta) r = r.filter(x => x.fecha <= filtroHasta + 'T23:59:59')
    return r
  }, [registros, filtroMod, filtroAcc, filtroDesde, filtroHasta])

  const tieneFiltros = filtroMod || filtroAcc || filtroDesde || filtroHasta
  const limpiar = () => { setFiltroMod(''); setFiltroAcc(''); setFiltroDesde(''); setFiltroHasta('') }

  const SELECT_CLS = `h-9 px-2.5 rounded-lg border border-slate-300 text-sm bg-white
                      text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500`

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-5">

      {/* Cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck size={22} className="text-primary-700" strokeWidth={1.8} />
            Log de Auditoría
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {registros.length} registro{registros.length !== 1 ? 's' : ''} · máx. 1 000 eventos almacenados.
          </p>
        </div>
        <Button variant="ghost" size="sm" iconLeft={RefreshCw} onClick={cargar} disabled={loading}>
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <div className="flex flex-wrap items-end gap-3">

          <div>
            <p className="text-xs font-medium text-slate-600 mb-1">Módulo</p>
            <select value={filtroMod} onChange={e => setFiltroMod(e.target.value)} className={SELECT_CLS}>
              <option value="">Todos los módulos</option>
              {Object.entries(MODULO_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600 mb-1">Acción</p>
            <select value={filtroAcc} onChange={e => setFiltroAcc(e.target.value)} className={SELECT_CLS}>
              <option value="">Todas las acciones</option>
              {Object.entries(ACCION_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600 mb-1">Desde</p>
            <input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)}
              className={`${SELECT_CLS} cursor-pointer`} />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-600 mb-1">Hasta</p>
            <input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)}
              className={`${SELECT_CLS} cursor-pointer`} />
          </div>

          {tieneFiltros && (
            <Button variant="ghost" size="sm" onClick={limpiar}>Limpiar</Button>
          )}

          {tieneFiltros && (
            <span className="text-xs text-slate-500 ml-1">
              {filtrados.length} de {registros.length} registros
            </span>
          )}
        </div>
      </Card>

      {/* Tabla */}
      <Card noPadding>
        <DataTable
          columns={COLUMNAS}
          data={filtrados}
          loading={loading}
          searchPlaceholder="Buscar por módulo, acción, detalle…"
          emptyTitle={tieneFiltros ? 'Sin resultados con esos filtros' : 'Sin registros de auditoría'}
          emptyMessage={
            tieneFiltros
              ? 'Cambia o limpia los filtros para ver más registros.'
              : 'Las acciones del sistema se registrarán automáticamente aquí.'
          }
          className="p-4"
        />
      </Card>

    </div>
  )
}
