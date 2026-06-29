import { useState, useMemo, useEffect } from 'react'
import { Search, ChevronUp, ChevronDown, ChevronsUpDown,
         ChevronLeft, ChevronRight, Eye, Pencil, Trash2 } from 'lucide-react'
import EmptyState from './EmptyState'

// ─── Opciones de paginación ───────────────────────────────────────────────────
const PAGE_SIZES = [25, 50, 100]

// ─── Skeleton de carga ───────────────────────────────────────────────────────
function SkeletonRows({ cols, rows = 5 }) {
  const widths = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/6', 'w-1/3']
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="border-b border-slate-100">
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} className="px-4 py-3">
          <div className={['h-3.5 bg-slate-200 rounded animate-pulse', widths[(i + j) % widths.length]].join(' ')} />
        </td>
      ))}
    </tr>
  ))
}

// ─── Icono de ordenamiento ────────────────────────────────────────────────────
function SortIcon({ col, sortKey, sortDir }) {
  if (!col.sortable) return null
  if (sortKey !== col.key) return <ChevronsUpDown size={13} className="text-slate-300 flex-shrink-0" />
  return sortDir === 'asc'
    ? <ChevronUp   size={13} className="text-primary-700 flex-shrink-0" />
    : <ChevronDown size={13} className="text-primary-700 flex-shrink-0" />
}

// ─── DataTable ────────────────────────────────────────────────────────────────

/**
 * Tabla de datos genérica del sistema GEPPI.
 *
 * @param {Array<{key, label, render?, sortable?, width?, align?}>} columns
 *   - render: (value, row) => ReactNode
 *   - align: 'left' | 'center' | 'right'
 * @param {Array<object>} data          — filas a mostrar
 * @param {boolean}       loading       — muestra skeleton
 * @param {string}        emptyTitle
 * @param {string}        emptyMessage
 * @param {boolean}       searchable    — default true
 * @param {string}        searchPlaceholder
 * @param {ReactNode}     headerActions — botones sobre la tabla (ej: "Nuevo")
 * @param {(row)=>void}   onView
 * @param {(row)=>void}   onEdit
 * @param {(row)=>void}   onDelete
 * @param {(row)=>void}   onRowClick
 * @param {string}        className
 */
export default function DataTable({
  columns          = [],
  data             = [],
  loading          = false,
  emptyTitle       = 'Sin registros',
  emptyMessage     = 'No hay datos para mostrar.',
  searchable       = true,
  searchPlaceholder= 'Buscar…',
  headerActions,
  onView,
  onEdit,
  onDelete,
  onRowClick,
  className        = '',
}) {
  // ── Estado interno ─────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('')
  const [search,      setSearch]      = useState('')
  const [sortKey,     setSortKey]     = useState(null)
  const [sortDir,     setSortDir]     = useState('asc')
  const [page,        setPage]        = useState(1)
  const [pageSize,    setPageSize]    = useState(PAGE_SIZES[0])

  // Debounce 300ms en el buscador
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // Resetear a página 1 cuando cambian los datos
  useEffect(() => { setPage(1) }, [data])

  // ── Ordenamiento ───────────────────────────────────────────────────────────
  const handleSort = (col) => {
    if (!col.sortable) return
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col.key)
      setSortDir('asc')
    }
    setPage(1)
  }

  // ── Filtrado + ordenamiento + paginación ───────────────────────────────────
  const filtered = useMemo(() => {
    if (!search) return data
    const q = search.toLowerCase()
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key]
        return val != null && String(val).toLowerCase().includes(q)
      })
    )
  }, [data, search, columns])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = String(av).localeCompare(String(bv), 'es', { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const paginated  = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  // ── Columnas de acciones ───────────────────────────────────────────────────
  const hasActions = onView || onEdit || onDelete
  const allColumns = hasActions
    ? [...columns, { key: '__actions__', label: '', width: 'w-24', sortable: false }]
    : columns

  // ── Alineación de celda ────────────────────────────────────────────────────
  const alignClass = (col) =>
    col.align === 'center' ? 'text-center' :
    col.align === 'right'  ? 'text-right'  : 'text-left'

  return (
    <div className={['flex flex-col gap-3', className].join(' ')}>

      {/* ── Barra superior: búsqueda + acciones ───────────────────────────── */}
      {(searchable || headerActions) && (
        <div className="flex flex-wrap items-center gap-3">
          {searchable && (
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 text-sm
                           text-slate-900 placeholder:text-slate-400 bg-white
                           focus:outline-none focus:ring-2 focus:ring-primary-500
                           focus:border-primary-500 transition-colors"
              />
            </div>
          )}
          {headerActions && <div className="flex items-center gap-2 ml-auto">{headerActions}</div>}
        </div>
      )}

      {/* ── Tabla ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            {/* Encabezados */}
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {allColumns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col)}
                    className={[
                      'px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide',
                      alignClass(col),
                      col.width || '',
                      col.sortable ? 'cursor-pointer hover:text-slate-900 select-none' : '',
                      col.key === '__actions__' ? 'text-right' : '',
                    ].join(' ')}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Cuerpo */}
            <tbody>
              {loading ? (
                <SkeletonRows cols={allColumns.length} />
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={allColumns.length}>
                    <EmptyState
                      title={emptyTitle}
                      description={emptyMessage}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((row, rowIdx) => (
                  <tr
                    key={row.id ?? rowIdx}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={[
                      'border-b border-slate-100 last:border-0',
                      'hover:bg-slate-50 transition-colors',
                      onRowClick ? 'cursor-pointer' : '',
                    ].join(' ')}
                  >
                    {allColumns.map((col) => {
                      if (col.key === '__actions__') {
                        return (
                          <td key="__actions__" className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {onView && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onView(row) }}
                                  title="Ver detalle"
                                  className="p-1.5 rounded-md text-slate-400 hover:text-primary-800
                                             hover:bg-primary-50 transition-colors"
                                >
                                  <Eye size={15} />
                                </button>
                              )}
                              {onEdit && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onEdit(row) }}
                                  title="Editar"
                                  className="p-1.5 rounded-md text-slate-400 hover:text-blue-700
                                             hover:bg-blue-50 transition-colors"
                                >
                                  <Pencil size={15} />
                                </button>
                              )}
                              {onDelete && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); onDelete(row) }}
                                  title="Eliminar"
                                  className="p-1.5 rounded-md text-slate-400 hover:text-red-600
                                             hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        )
                      }

                      const value = row[col.key]
                      return (
                        <td
                          key={col.key}
                          className={[
                            'px-4 py-2.5 text-slate-700',
                            alignClass(col),
                            col.width || '',
                          ].join(' ')}
                        >
                          {col.render ? col.render(value, row) : (value ?? '—')}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Paginación ──────────────────────────────────────────────────── */}
        {!loading && sorted.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3
                          px-4 py-3 border-t border-slate-100 bg-slate-50/50">

            {/* Info y selector de tamaño */}
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                {sorted.length === 0 ? '0' : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, sorted.length)}`}
                {' '}de{' '}
                <strong className="text-slate-700">{sorted.length}</strong>
                {search && ` (filtrado de ${data.length})`}
              </span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="h-7 px-2 rounded-md border border-slate-300 text-xs bg-white
                           focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s} por página</option>
                ))}
              </select>
            </div>

            {/* Controles de página */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-900
                           hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none
                           transition-colors"
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-3 py-1 text-xs font-medium text-slate-700 bg-white
                               border border-slate-300 rounded-md select-none">
                {safePage} / {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-900
                           hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none
                           transition-colors"
                aria-label="Página siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
